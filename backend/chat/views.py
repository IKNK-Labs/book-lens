import os
import uuid

from django.db.models import F
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from supabase import create_client

from characters.models import Character, Persona

from .models import AppUser, ChatSession, ConversationFeedback, ConversationLog
from .pipeline import run_chat


def resolve_app_user_id(raw_user_id):
    """Return app_user.id from either app_user.id or auth.users.id."""

    if raw_user_id in (None, ""):
        return ""

    value = str(raw_user_id).strip()
    if not value:
        return ""

    if value.isdigit():
        try:
            return str(AppUser.objects.only("id").get(id=int(value)).id)
        except AppUser.DoesNotExist:
            return ""

    try:
        auth_user_id = uuid.UUID(value)
    except ValueError:
        return ""

    try:
        return str(AppUser.objects.only("id").get(auth_user_id=auth_user_id).id)
    except AppUser.DoesNotExist:
        return ""


def _get_bearer_token(request):
    auth_header = request.headers.get("Authorization", "")
    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return ""
    return token.strip()


def _resolve_authenticated_app_user_id(request):
    """Resolve app_user.id from the Supabase JWT in Authorization header."""

    token = _get_bearer_token(request)
    if not token:
        return None, Response({"error": "authentication required"}, status=401)

    supabase_url = (
        os.environ.get("SUPABASE_URL")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    ).strip()
    supabase_key = (
        os.environ.get("SUPABASE_PUBLISHABLE_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
        or ""
    ).strip()
    if not supabase_url or not supabase_key:
        return None, Response({"error": "Supabase auth is not configured"}, status=503)

    try:
        auth_user = create_client(supabase_url, supabase_key).auth.get_user(token).user
    except Exception:
        return None, Response({"error": "invalid authentication token"}, status=401)

    auth_user_id = getattr(auth_user, "id", "")
    app_user_id = resolve_app_user_id(auth_user_id)
    if not app_user_id:
        return None, Response({"error": "user not found"}, status=404)

    return int(app_user_id), None


def _reject_mismatched_user_id(request, app_user_id, source):
    raw_user_id = source.get("user_id")
    if raw_user_id in (None, ""):
        return None

    supplied_app_user_id = resolve_app_user_id(raw_user_id)
    if not supplied_app_user_id:
        return Response({"error": "user not found"}, status=404)
    if int(supplied_app_user_id) != app_user_id:
        return Response({"error": "user forbidden"}, status=403)
    return None


def _resolve_required_app_user_id(raw_user_id):
    if raw_user_id in (None, ""):
        return None, Response({"error": "user_id is required"}, status=400)

    app_user_id = resolve_app_user_id(raw_user_id)
    if not app_user_id:
        return None, Response({"error": "user not found"}, status=404)

    return int(app_user_id), None


def _serialize_chat_session(session):
    character = session.character
    book = session.book
    return {
        "id": str(session.id),
        "character_id": character.id,
        "character_name": character.name,
        "character_role": character.role,
        "character_emoji": character.emoji,
        "character_profile_image_url": character.profile_image_url,
        "book_id": book.id,
        "book_title": book.title,
        "title": session.title,
        "last_message_preview": session.last_message_preview,
        "last_active_at": session.last_active_at.isoformat()
        if session.last_active_at
        else None,
    }


def _serialize_conversation_log(log):
    return {
        "id": log.id,
        "role": log.role,
        "message": log.message,
        "is_flagged": log.is_flagged,
        "turn_index": log.turn_index,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


def _get_or_create_latest_session(app_user_id, character):
    session = (
        ChatSession.objects.select_related("character", "book")
        .filter(user_id=app_user_id, character_id=character.id)
        .order_by("-last_active_at", "-created_at")
        .first()
    )
    if session is not None:
        return session, False

    now = timezone.now()
    session = ChatSession.objects.create(
        user_id=app_user_id,
        character_id=character.id,
        book_id=character.book_id,
        title=f"{character.name}와의 대화",
        last_active_at=now,
        created_at=now,
        updated_at=now,
    )
    session.character = character
    session.book = character.book
    return session, True


def _get_session_id_or_none(raw_session_id):
    if raw_session_id in (None, ""):
        return None
    try:
        return uuid.UUID(str(raw_session_id))
    except (TypeError, ValueError):
        return ""


def _parse_message_limit(raw_limit):
    if raw_limit in (None, ""):
        return 50
    try:
        limit = int(raw_limit)
    except (TypeError, ValueError):
        return 50
    return min(max(limit, 1), 100)


class ChatView(APIView):
    """POST /api/chat/ — 캐릭터 대화 엔드포인트."""

    permission_classes = [AllowAny]

    def post(self, request):
        character_id = request.data.get("character_id")
        raw_user_message = request.data.get("message", "")

        if not character_id:
            return Response({"error": "character_id is required"}, status=400)
        if not isinstance(raw_user_message, str):
            return Response({"error": "message is required"}, status=400)
        user_message = raw_user_message.strip()
        if not user_message:
            return Response({"error": "message is required"}, status=400)

        app_user_id, error = _resolve_authenticated_app_user_id(request)
        if error is not None:
            return error
        user_error = _reject_mismatched_user_id(request, app_user_id, request.data)
        if user_error is not None:
            return user_error

        try:
            character = Character.objects.select_related("book").get(id=int(character_id))
        except (Character.DoesNotExist, TypeError, ValueError):
            return Response({"error": "character not found"}, status=404)

        raw_session_id = request.data.get("session_id")
        session_uuid = _get_session_id_or_none(raw_session_id)
        if session_uuid == "":
            return Response({"error": "session not found"}, status=404)

        if session_uuid is None:
            session, _ = _get_or_create_latest_session(app_user_id, character)
        else:
            try:
                session = ChatSession.objects.select_related("character", "book").get(
                    id=session_uuid
                )
            except ChatSession.DoesNotExist:
                return Response({"error": "session not found"}, status=404)
            if session.user_id != app_user_id:
                return Response({"error": "session forbidden"}, status=403)
            if session.character_id != character.id:
                return Response(
                    {"error": "session character mismatch"},
                    status=400,
                )

        try:
            result = run_chat(
                user_id=str(app_user_id),
                character_id=character.id,
                user_message=user_message,
                session_id=str(session.id),
            )
        except ChatSession.DoesNotExist:
            return Response({"error": "session not found"}, status=404)
        except Exception as exc:
            return Response({"error": str(exc)}, status=500)

        return Response(result, status=200)


class ChatSessionListCreateView(APIView):
    """GET/POST /api/chat/sessions — user chat threads."""

    permission_classes = [AllowAny]

    def get(self, request):
        app_user_id, error = _resolve_authenticated_app_user_id(request)
        if error is not None:
            return error
        user_error = _reject_mismatched_user_id(request, app_user_id, request.query_params)
        if user_error is not None:
            return user_error

        sessions = (
            ChatSession.objects.select_related("character", "book")
            .filter(user_id=app_user_id)
            .order_by("-last_active_at", "-created_at")
        )
        return Response([_serialize_chat_session(session) for session in sessions])

    def post(self, request):
        character_id = request.data.get("character_id")
        if not character_id:
            return Response({"error": "character_id is required"}, status=400)

        app_user_id, error = _resolve_authenticated_app_user_id(request)
        if error is not None:
            return error
        user_error = _reject_mismatched_user_id(request, app_user_id, request.data)
        if user_error is not None:
            return user_error

        try:
            character = Character.objects.select_related("book").get(id=int(character_id))
        except (Character.DoesNotExist, TypeError, ValueError):
            return Response({"error": "character not found"}, status=404)

        session, created = _get_or_create_latest_session(app_user_id, character)
        return Response(
            _serialize_chat_session(session),
            status=201 if created else 200,
        )


class ChatSessionDetailView(APIView):
    """DELETE /api/chat/sessions/{session_id} — hard delete a user chat thread."""

    permission_classes = [AllowAny]

    def delete(self, request, session_id):
        app_user_id, error = _resolve_authenticated_app_user_id(request)
        if error is not None:
            return error
        user_error = _reject_mismatched_user_id(request, app_user_id, request.query_params)
        if user_error is not None:
            return user_error

        try:
            session = ChatSession.objects.only("id", "user_id").get(id=session_id)
        except ChatSession.DoesNotExist:
            return Response({"error": "session not found"}, status=404)

        if session.user_id != app_user_id:
            return Response({"error": "session forbidden"}, status=403)

        session.delete()
        return Response(status=204)


class ChatSessionMessagesView(APIView):
    """GET /api/chat/sessions/{session_id}/messages — session transcript."""

    permission_classes = [AllowAny]

    def get(self, request, session_id):
        app_user_id, error = _resolve_authenticated_app_user_id(request)
        if error is not None:
            return error
        user_error = _reject_mismatched_user_id(request, app_user_id, request.query_params)
        if user_error is not None:
            return user_error

        try:
            session = ChatSession.objects.only("id", "user_id").get(id=session_id)
        except ChatSession.DoesNotExist:
            return Response({"error": "session not found"}, status=404)

        if session.user_id != app_user_id:
            return Response({"error": "session forbidden"}, status=403)

        limit = _parse_message_limit(request.query_params.get("limit"))
        logs = (
            ConversationLog.objects.filter(session_id=session.id, user_id=app_user_id)
            .order_by(F("turn_index").asc(nulls_last=True), "created_at", "id")[:limit]
        )
        return Response([_serialize_conversation_log(log) for log in logs])


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
        except (Character.DoesNotExist, TypeError, ValueError):
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
