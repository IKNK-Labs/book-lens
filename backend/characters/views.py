import json
import os
import re
import urllib.parse

from google import genai
from google.genai import types
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Character, Persona
from .serializers import CharacterSerializer, PersonaSerializer

_CHARACTER_GENERATE_PROMPT = """동화책 등장인물 정보를 JSON으로 생성하세요. 다른 설명은 쓰지 마세요.

중요: "{character_name}"이(가) "{book_title}"의 실제 등장인물이 아니라면 반드시 {{"error": "해당 캐릭터는 이 동화책의 등장인물이 아닙니다."}} 만 반환하세요.

실제 등장인물이라면 아래 JSON으로만 응답하세요:

{{
  "name": "등장인물 이름",
  "role": "역할 (주인공/악역/조력자/조연 중 하나)",
  "gender": "성별 (여성/남성/미상 중 하나)",
  "emoji": "캐릭터를 잘 표현하는 이모지 1개",
  "description": "캐릭터 소개 (100자 이내, 한국어, 해당 동화책 기준)"
}}

동화책 제목: "{book_title}"
등장인물 이름: "{character_name}"
"""


class CharacterGenerateView(APIView):
    """POST /api/admin/characters/generate — Gemini로 캐릭터 정보 자동완성"""
    permission_classes = [AllowAny]

    def post(self, request):
        api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
        if not api_key:
            return Response({"error": "GOOGLE_API_KEY 설정되지 않았습니다."}, status=503)

        book_title = (request.data.get("book_title") or "").strip()
        character_name = (request.data.get("character_name") or "").strip()
        if not book_title or not character_name:
            return Response({"error": "book_title과 character_name을 입력해주세요."}, status=400)

        client = genai.Client(api_key=api_key)
        result = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=_CHARACTER_GENERATE_PROMPT.format(
                book_title=book_title, character_name=character_name
            ),
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )

        raw = result.text.strip()
        json_block = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
        if json_block:
            candidate = json_block.group(1).strip()
        else:
            json_obj = re.search(r"\{[\s\S]*\}", raw)
            candidate = json_obj.group(0) if json_obj else raw

        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            return Response({"error": "AI 응답을 파싱할 수 없습니다."}, status=500)

        if "error" in data:
            return Response({"error": data["error"]}, status=422)

        seed = urllib.parse.quote(character_name)
        profile_image_url = f"https://api.dicebear.com/9.x/fun-emoji/svg?seed={seed}"

        return Response({
            "name": data.get("name", character_name),
            "role": data.get("role", ""),
            "gender": data.get("gender", ""),
            "emoji": data.get("emoji", ""),
            "description": data.get("description", ""),
            "profile_image_url": profile_image_url,
        })


class CharacterAdminViewSet(ModelViewSet):
    serializer_class = CharacterSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Character.objects.all()
        book_id = self.request.query_params.get("book_id")
        if book_id:
            qs = qs.filter(book_id=book_id)
        return qs


class PersonaAdminViewSet(ModelViewSet):
    serializer_class = PersonaSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Persona.objects.select_related("character", "book").all()
        character_id = self.request.query_params.get("character_id")
        book_id = self.request.query_params.get("book_id")
        if character_id:
            qs = qs.filter(character_id=character_id)
        if book_id:
            qs = qs.filter(book_id=book_id)
        return qs
