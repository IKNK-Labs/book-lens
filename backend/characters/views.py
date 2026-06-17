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

_PERSONA_GENERATE_PROMPT = """동화책 캐릭터와 대화할 AI 페르소나 정보를 JSON으로 생성하세요. 다른 설명은 쓰지 마세요.

중요:
- 어린이 사용자를 대상으로 하므로 친절하고 안전한 표현을 사용하세요.
- 원작 캐릭터의 성격과 말투를 유지하되, 사용자가 질문하며 대화하기 좋은 형태로 작성하세요.
- approved_status는 반드시 "draft"로 반환하세요.
- tags는 문자열 배열로 반환하세요.

아래 JSON 형식으로만 응답하세요.

{{
  "greeting_open": "대화를 시작할 때 캐릭터가 건네는 첫 인사",
  "greeting_close": "대화를 마칠 때 캐릭터가 건네는 끝 인사",
  "personality": "캐릭터 성격 설명",
  "speech_style": "말투 설명",
  "catchphrase": "자주 쓰는 짧은 표현",
  "bio": "캐릭터 소개",
  "tags": ["태그1", "태그2", "태그3"],
  "opening_scene": "대화가 시작되는 장면",
  "era": "동화 속 시대 또는 배경",
  "background": "캐릭터가 있는 공간이나 상황 설명",
  "user_role": "사용자가 맡는 역할",
  "user_relationship": "사용자와 캐릭터의 관계",
  "system_prompt": "LLM에게 전달할 시스템 프롬프트",
  "approved_status": "draft"
}}

동화책 제목: "{book_title}"
캐릭터 이름: "{character_name}"
캐릭터 역할: "{character_role}"
캐릭터 소개: "{character_description}"
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


class PersonaGenerateView(APIView):
    """POST /api/admin/personas/generate - Gemini로 페르소나 정보 자동완성"""
    permission_classes = [AllowAny]

    def post(self, request):
        api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
        if not api_key:
            return Response({"error": "GOOGLE_API_KEY 설정이 필요합니다."}, status=503)

        book_title = (request.data.get("book_title") or "").strip()
        character_name = (request.data.get("character_name") or "").strip()
        character_role = (request.data.get("character_role") or "").strip()
        character_description = (request.data.get("character_description") or "").strip()
        if not book_title or not character_name:
            return Response({"error": "book_title과 character_name을 입력해주세요."}, status=400)

        client = genai.Client(api_key=api_key)
        result = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=_PERSONA_GENERATE_PROMPT.format(
                book_title=book_title,
                character_name=character_name,
                character_role=character_role,
                character_description=character_description,
            ),
            config=types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=4096,
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

        tags = data.get("tags", [])
        if not isinstance(tags, list):
            tags = []

        return Response({
            "greeting_open": data.get("greeting_open", ""),
            "greeting_close": data.get("greeting_close", ""),
            "personality": data.get("personality", ""),
            "speech_style": data.get("speech_style", ""),
            "catchphrase": data.get("catchphrase", ""),
            "bio": data.get("bio", ""),
            "tags": [str(tag) for tag in tags],
            "opening_scene": data.get("opening_scene", ""),
            "era": data.get("era", ""),
            "background": data.get("background", ""),
            "user_role": data.get("user_role", ""),
            "user_relationship": data.get("user_relationship", ""),
            "system_prompt": data.get("system_prompt", ""),
            "approved_status": "draft",
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
