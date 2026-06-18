from __future__ import annotations

import logging

from django.core.exceptions import ObjectDoesNotExist
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .graph import run_chat_pipeline
from .serializers import ChatRequestSerializer, ChatResponseSerializer


logger = logging.getLogger(__name__)


class CharacterChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            result = run_chat_pipeline(
                {
                    "user_id": data.get("user_id"),
                    "character_id": data["character_id"],
                    "user_message": data["user_message"],
                    "top_k": data["top_k"],
                }
            )
        except ObjectDoesNotExist:
            return Response({"error": "character_id에 해당하는 캐릭터가 없습니다."}, status=404)
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=503)
        except Exception as exc:
            logger.exception("BookLens chatbot pipeline failed")
            return Response(
                {"error": "챗봇 응답 생성 중 오류가 발생했습니다.", "detail": str(exc)},
                status=500,
            )

        response_data = {
            "response": result.get("response", ""),
            "category": result.get("category", "story"),
        }
        response_serializer = ChatResponseSerializer(data=response_data)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data)
