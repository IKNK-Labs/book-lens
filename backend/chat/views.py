import uuid

from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from characters.models import Character, Persona

from .models import AppUser, ConversationFeedback, ConversationLog
from .pipeline import run_chat


def resolve_app_user_id(raw_user_id):
    """Return app_user.id from either app_user.id or auth.users.id."""

    if raw_user_id in (None, ""):
        return ""

    value = str(raw_user_id).strip()
    if not value:
        return ""

    if value.isdigit():
        return value

    try:
        auth_user_id = uuid.UUID(value)
    except ValueError:
        return ""

    try:
        return str(AppUser.objects.only("id").get(auth_user_id=auth_user_id).id)
    except AppUser.DoesNotExist:
        return ""


class ChatView(APIView):
    """POST /api/chat/ — 캐릭터 대화 엔드포인트."""

    permission_classes = [AllowAny]

    def post(self, request):
        character_id = request.data.get("character_id")
        user_message = request.data.get("message", "").strip()

        if not character_id:
            return Response({"error": "character_id is required"}, status=400)
        if not user_message:
            return Response({"error": "message is required"}, status=400)

        # Supabase auth.users.id는 JWT에서 추출하는 것이 이상적이나,
        # users 앱 구현 전까지는 요청 바디의 user_id를 사용한다.
        user_id = resolve_app_user_id(request.data.get("user_id", ""))

        try:
            result = run_chat(
                user_id=str(user_id),
                character_id=int(character_id),
                user_message=user_message,
            )
        except Exception as exc:
            return Response({"error": str(exc)}, status=500)

        return Response(result, status=200)


class ConversationFeedbackView(APIView):
    """POST /api/chat/feedback — save like/dislike/report for an assistant message."""

    permission_classes = [AllowAny]

    def post(self, request):
        app_user_id = resolve_app_user_id(request.data.get("user_id", ""))
        if not app_user_id:
            return Response({"error": "user_id is required"}, status=400)

        conversation_log_id = request.data.get("conversation_log_id")
        feedback_type = request.data.get("feedback_type")
        reason = request.data.get("reason")

        if not conversation_log_id:
            return Response({"error": "conversation_log_id is required"}, status=400)
        if feedback_type not in {
            ConversationFeedback.FEEDBACK_LIKE,
            ConversationFeedback.FEEDBACK_DISLIKE,
            ConversationFeedback.FEEDBACK_REPORT,
        }:
            return Response({"error": "invalid feedback_type"}, status=400)

        try:
            log = ConversationLog.objects.select_related("character__book").get(
                id=conversation_log_id,
                user_id=int(app_user_id),
                role=ConversationLog.ROLE_ASSISTANT,
            )
        except (ConversationLog.DoesNotExist, ValueError):
            return Response({"error": "conversation log not found"}, status=404)

        feedback = ConversationFeedback.objects.filter(
            conversation_log=log,
            user_id=int(app_user_id),
        ).first()
        created = feedback is None

        if feedback is None:
            feedback = ConversationFeedback.objects.create(
                id=uuid.uuid4(),
                conversation_log=log,
                user_id=int(app_user_id),
                character_id=log.character_id,
                book_id=log.character.book_id,
                feedback_type=feedback_type,
                reason=reason or None,
                created_at=timezone.now(),
            )
        else:
            feedback.feedback_type = feedback_type
            feedback.reason = reason or None
            feedback.save(update_fields=["feedback_type", "reason"])

        return Response(
            {
                "id": str(feedback.id),
                "conversation_log_id": feedback.conversation_log_id,
                "feedback_type": feedback.feedback_type,
                "reason": feedback.reason,
                "created": created,
            },
            status=201 if created else 200,
        )


class GreetingView(APIView):
    """GET /api/chat/greeting/?character_id=<int>[&user_id=<app_user.id|uuid>]

    채팅 화면 진입 시 캐릭터 인사말과 재방문 여부를 반환한다.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        character_id = request.query_params.get("character_id")
        if not character_id:
            return Response({"error": "character_id is required"}, status=400)

        try:
            character = Character.objects.select_related("book").get(id=int(character_id))
        except (Character.DoesNotExist, ValueError):
            return Response({"error": "character not found"}, status=404)

        # persona.greeting_open 조회 (없으면 이름 기반 기본값)
        greeting = f"안녕! 나는 {character.name}이야."
        try:
            persona = Persona.objects.get(character_id=character.id)
            if persona.greeting_open:
                greeting = persona.greeting_open
        except Persona.DoesNotExist:
            pass

        # has_history: user_id 있을 때만 이전 대화 여부 확인
        has_history = False
        assistant_log_id = ""
        app_user_id = resolve_app_user_id(request.query_params.get("user_id", ""))
        if app_user_id:
            has_history = ConversationLog.objects.filter(
                character_id=character.id, user_id=int(app_user_id)
            ).exists()
            assistant_log = ConversationLog.objects.create(
                character_id=character.id,
                user_id=int(app_user_id),
                role=ConversationLog.ROLE_ASSISTANT,
                message=greeting,
                is_flagged=False,
            )
            assistant_log_id = str(assistant_log.id)

        return Response(
            {
                "greeting": greeting,
                "assistant_log_id": assistant_log_id,
                "character_name": character.name,
                "character_role": character.role,
                "character_emoji": character.emoji,
                "character_profile_image_url": character.profile_image_url,
                "book_id": character.book_id,
                "book_title": character.book.title,
                "has_history": has_history,
            },
            status=200,
        )
