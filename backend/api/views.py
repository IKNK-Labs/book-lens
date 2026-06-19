from datetime import datetime, time

from django.db import DatabaseError
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET

from books.models import Book
from characters.models import Character, Persona
from chat.models import ConversationFeedback, ConversationLog
from moderation.models import ForbiddenRule


EMPTY_FEEDBACK = {
    "like_count": 0,
    "dislike_count": 0,
    "report_count": 0,
}


def get_feedback_summary():
    try:
        return ConversationFeedback.objects.aggregate(
            like_count=Count("id", filter=Q(feedback_type=ConversationFeedback.FEEDBACK_LIKE)),
            dislike_count=Count("id", filter=Q(feedback_type=ConversationFeedback.FEEDBACK_DISLIKE)),
            report_count=Count("id", filter=Q(feedback_type=ConversationFeedback.FEEDBACK_REPORT)),
        )
    except DatabaseError:
        return EMPTY_FEEDBACK.copy()


@require_GET
def root(request):
    return JsonResponse(
        {
            "service": "book-lens-api",
            "status": "ok",
            "endpoints": {
                "health": "/api/health/",
            },
        }
    )


@require_GET
def health(request):
    return JsonResponse({"status": "ok"})


@require_GET
def admin_dashboard(request):
    today = timezone.localdate()
    start = timezone.make_aware(datetime.combine(today, time.min))
    end = timezone.make_aware(datetime.combine(today, time.max))

    today_logs = ConversationLog.objects.filter(created_at__range=(start, end))
    today_user_messages = today_logs.filter(role=ConversationLog.ROLE_USER)
    today_flagged = today_logs.filter(is_flagged=True).count()
    draft_personas = Persona.objects.filter(approved_status="draft").count()
    rejected_personas = Persona.objects.filter(approved_status="rejected").count()
    feedback = get_feedback_summary()
    report_feedback = feedback["report_count"]

    top_characters = list(
        ConversationLog.objects
        .filter(role=ConversationLog.ROLE_USER)
        .values(
            "character_id",
            "character__name",
            "character__role",
            "character__emoji",
            "character__profile_image_url",
            "character__book__title",
        )
        .annotate(conversation_count=Count("id"))
        .order_by("-conversation_count", "character__name")[:5]
    )

    top_books = list(
        ConversationLog.objects
        .filter(role=ConversationLog.ROLE_USER)
        .values(
            "character__book_id",
            "character__book__title",
            "character__book__author",
        )
        .annotate(conversation_count=Count("id"))
        .order_by("-conversation_count", "character__book__title")[:5]
    )

    persona_status = Persona.objects.aggregate(
        approved=Count("id", filter=Q(approved_status="approved")),
        draft=Count("id", filter=Q(approved_status="draft")),
        rejected=Count("id", filter=Q(approved_status="rejected")),
    )

    payload = {
        "metrics": {
            "today_conversations": today_user_messages.count(),
            "active_users": today_user_messages.values("user_id").distinct().count(),
            "review_needed": today_flagged + draft_personas + report_feedback,
            "total_books": Book.objects.count(),
            "total_characters": Character.objects.count(),
        },
        "top_characters": [
            {
                "id": row["character_id"],
                "name": row["character__name"],
                "role": row["character__role"],
                "emoji": row["character__emoji"],
                "profile_image_url": row["character__profile_image_url"],
                "book_title": row["character__book__title"],
                "conversation_count": row["conversation_count"],
            }
            for row in top_characters
        ],
        "top_books": [
            {
                "id": row["character__book_id"],
                "title": row["character__book__title"],
                "author": row["character__book__author"],
                "conversation_count": row["conversation_count"],
            }
            for row in top_books
        ],
        "feedback": feedback,
        "persona_status": {
            **persona_status,
            "rejected": rejected_personas,
        },
        "safety": {
            "flagged_today": today_flagged,
            "active_rules": ForbiddenRule.objects.filter(is_active=True).count(),
            "reports": report_feedback,
        },
    }

    return JsonResponse(payload)
