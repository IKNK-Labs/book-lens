import io
import json
import logging
import os
import re
import uuid

from google import genai
from google.genai import types
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Character, Persona
from .serializers import CharacterSerializer, PersonaSerializer

logger = logging.getLogger(__name__)

_IMAGE_MODEL = "gemini-2.5-flash-image"

_CHARACTER_GENERATE_PROMPT = """동화책 등장인물 정보를 JSON으로 생성하세요. 다른 설명은 쓰지 마세요.

중요: "{character_name}"이(가) "{book_title}"의 실제 등장인물이 아니라면 반드시 {{"error": "해당 캐릭터는 이 동화책의 등장인물이 아닙니다."}} 만 반환하세요.

실제 등장인물이라면 아래 JSON으로만 응답하세요:

{{
  "name": "등장인물 이름",
  "role": "역할 (주인공/악역/조력자/조연 중 하나)",
  "gender": "성별 (여성/남성/미상 중 하나)",
  "emoji": "캐릭터를 잘 표현하는 이모지 1개",
  "description": "외형 묘사 (100자 이내, 한국어, 이미지 생성용 — 털 색·체형·의상·눈 색 등 시각적 특징 위주로 묘사, 날카로운/무서운/공포 같은 단어 사용 금지)"
}}

동화책 제목: "{book_title}"
등장인물 이름: "{character_name}"
"""

# PROHIBITED_CONTENT를 유발하는 단어를 안전한 표현으로 치환
_SAFE_WORD_MAP = [
    ("날카로운 이빨", "커다란 입"),
    ("날카로운 발톱", "커다란 손"),
    ("날카로운", "선명한"),
    ("무서운", "강인한"),
    ("공포스러운", "강인한"),
    ("위협적인", "강인한"),
    ("흉측한", "독특한"),
    ("징그러운", "독특한"),
    ("잔인한", "강한"),
    ("야수 같은", "동물형"),
    ("괴물", "독특한 생김새의"),
]


def _sanitize_description(desc: str) -> str:
    for old, new in _SAFE_WORD_MAP:
        desc = desc.replace(old, new)
    return desc


def _upload_to_supabase(img_bytes: bytes, mime_type: str) -> str:
    """이미지 바이트를 Supabase Storage에 업로드하고 퍼블릭 URL 반환."""
    from supabase import create_client

    url = (os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")).strip()
    key = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
    bucket = os.environ.get("SUPABASE_BUCKET", "character-images").strip()

    if not url or not key:
        raise ValueError("SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 설정되지 않았습니다.")

    ext = "jpg" if "jpeg" in mime_type else mime_type.split("/")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"

    sb = create_client(url, key)

    existing = [b.name for b in sb.storage.list_buckets()]
    if bucket not in existing:
        sb.storage.create_bucket(bucket, options={"public": True})

    sb.storage.from_(bucket).upload(
        path=filename,
        file=img_bytes,
        file_options={"content-type": mime_type},
    )
    return sb.storage.from_(bucket).get_public_url(filename)


def _generate_and_upload_image(client, name: str, description: str, role: str) -> str:
    """Gemini로 캐릭터 이미지 생성 후 Supabase Storage 업로드, 영구 URL 반환."""
    tone = "장난스럽게 짓궂은, 위협적이지 않은" if role == "악역" else "따뜻하고 친근한"

    safe_description = _sanitize_description(description)

    # PROHIBITED_CONTENT 발생 시 단계적으로 단순화된 프롬프트 사용
    prompts = [
        # 1차: 원본 description 기반
        (
            "동화책 그림책 일러스트 스타일, 수채화 느낌의 부드러운 색감, "
            "아이들이 보기에 안전하고 친근한 그림체, "
            f"외형 및 분위기: {description}, "
            "배경 없이 캐릭터 단독 초상화, 정면 또는 반측면, "
            f"무섭거나 폭력적인 표현 없이, {tone} 톤"
        ),
        # 2차: 위험 단어 치환된 sanitized description — 외형 특징 유지
        (
            "동화책 그림책 일러스트 스타일, 수채화 느낌의 부드러운 색감, "
            "아이들이 보기에 안전하고 친근한 그림체, "
            f"외형 및 분위기: {safe_description}, "
            "배경 없이 캐릭터 단독 초상화, 정면 또는 반측면, "
            f"무섭거나 폭력적인 표현 없이, {tone} 톤"
        ),
        # 3차: description 완전 제거, 역할 기반 최소 프롬프트
        (
            "동화책 그림책 일러스트, 수채화 스타일, "
            f"귀엽고 친근한 동화책 {role} 캐릭터 초상화, "
            "아이들을 위한 안전하고 밝은 그림체"
        ),
    ]

    img_bytes = None
    mime_type = "image/png"
    last_error = None

    for attempt, prompt in enumerate(prompts):
        try:
            response = client.models.generate_content(
                model=_IMAGE_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )

            candidates = response.candidates
            if not candidates:
                raise ValueError("Gemini 응답에 후보가 없습니다.")

            candidate = candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)
            if finish_reason and "PROHIBITED_CONTENT" in str(finish_reason):
                logger.warning("이미지 생성 시도 %d: PROHIBITED_CONTENT — 프롬프트 단순화 후 재시도", attempt + 1)
                last_error = ValueError("콘텐츠 정책에 의해 차단됨 (PROHIBITED_CONTENT)")
                continue

            if not getattr(candidate, "content", None):
                raise ValueError("Gemini 응답 후보의 content가 비어 있습니다.")

            for part in candidate.content.parts:
                if part.inline_data is not None:
                    img_bytes = part.inline_data.data
                    mime_type = part.inline_data.mime_type or "image/png"
                    break

            if img_bytes:
                break

            raise ValueError("Gemini 응답에 이미지 파트가 없습니다.")

        except Exception as e:
            last_error = e
            logger.warning("이미지 생성 시도 %d 실패: %s", attempt + 1, e)

    if not img_bytes:
        raise ValueError(f"이미지 생성 {len(prompts)}회 모두 실패: {last_error}")

    try:
        from PIL import Image as _Image
        img = _Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = img.resize((512, 512), _Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=88)
        img_bytes = buf.getvalue()
        mime_type = "image/jpeg"
    except ImportError:
        pass

    return _upload_to_supabase(img_bytes, mime_type)


class CharacterGenerateView(APIView):
    """POST /api/admin/characters/generate — Gemini로 캐릭터 정보 + 이미지 자동완성"""
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

        # 1단계: 캐릭터 텍스트 정보 생성
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

        role = data.get("role", "")
        description = data.get("description", "")

        # 2단계: 이미지 생성 → Supabase 업로드 → 영구 URL
        try:
            profile_image_url = _generate_and_upload_image(
                client=client,
                name=data.get("name", character_name),
                description=description,
                role=role,
            )
        except Exception as e:
            logger.error("캐릭터 이미지 생성/업로드 실패: %s", e)
            return Response(
                {"error": f"이미지 생성에 실패했습니다: {e}"},
                status=500,
            )

        return Response({
            "name": data.get("name", character_name),
            "role": role,
            "gender": data.get("gender", ""),
            "emoji": data.get("emoji", ""),
            "description": description,
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
