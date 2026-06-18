import uuid

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from characters.models import Character, Persona

from .models import ConversationLog
from .pipeline import run_chat


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
        user_id = request.data.get("user_id", "")

        try:
            result = run_chat(
                user_id=str(user_id),
                character_id=int(character_id),
                user_message=user_message,
            )
        except Exception as exc:
            return Response({"error": str(exc)}, status=500)

        return Response(result, status=200)


class GreetingView(APIView):
    """GET /api/chat/greeting/?character_id=<int>[&user_id=<uuid>]

    채팅 화면 진입 시 캐릭터 인사말과 재방문 여부를 반환한다.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        character_id = request.query_params.get("character_id")
        if not character_id:
            return Response({"error": "character_id is required"}, status=400)

        try:
            character = Character.objects.get(id=int(character_id))
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
        user_id_str = request.query_params.get("user_id", "")
        if user_id_str:
            try:
                user_uuid = uuid.UUID(user_id_str)
                has_history = ConversationLog.objects.filter(
                    character_id=character.id, user_id=user_uuid
                ).exists()
            except (ValueError, Exception):
                pass

        return Response(
            {
                "greeting": greeting,
                "character_name": character.name,
                "character_emoji": character.emoji,
                "character_profile_image_url": character.profile_image_url,
                "has_history": has_history,
            },
            status=200,
        )
