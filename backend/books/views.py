import json
import os
import re

from google import genai
from google.genai import types
from django.db.models import Count, OuterRef, Subquery
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from characters.models import Character

from .models import Book, BookContent
from .serializers import BookContentSerializer, BookSerializer

_GENERATE_PROMPT = """동화책 제목이 주어지면 아래 JSON 형식으로만 응답하세요. 다른 설명은 쓰지 마세요.

{{
  "author": "원작자 이름",
  "publisher": "대표 출판사 이름",
  "description": "줄거리 요약 (200자 이내, 한국어)",
  "content": "동화 본문 (아이 친화적 문체, 500자~1000자, 한국어)"
}}

동화책 제목: "{title}"
"""


class BookGenerateView(APIView):
    """POST /api/admin/books/generate/ — Gemini로 동화책 정보 자동완성"""
    permission_classes = [AllowAny]

    def post(self, request):
        api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
        if not api_key:
            return Response(
                {"error": "GOOGLE_API_KEY 설정되지 않았습니다. infra/.env를 확인해주세요."},
                status=503,
            )

        title = (request.data.get("title") or "").strip()
        if not title:
            return Response({"error": "title 필드를 입력해주세요."}, status=400)

        client = genai.Client(api_key=api_key)
        result = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=_GENERATE_PROMPT.format(title=title),
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=8192,
                response_mime_type="application/json", # 강제로 JSON만 출력하게 하기
            ),
        )

        raw = result.text.strip()
        print(raw)

        # 코드 블록 안의 JSON 우선 추출, 없으면 첫 번째 JSON 객체 추출
        json_block = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
        if json_block:
            candidate = json_block.group(1).strip()
        else:
            json_obj = re.search(r"\{[\s\S]*\}", raw)
            candidate = json_obj.group(0) if json_obj else raw

        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            return Response({"error": "AI 응답을 파싱할 수 없습니다.", "raw": raw}, status=500)

        return Response({
            "author": data.get("author", ""),
            "publisher": data.get("publisher", ""),
            "description": data.get("description", ""),
            "content": data.get("content", ""),
        })


def get_book_queryset():
    first_character = Character.objects.filter(book_id=OuterRef("pk")).order_by("id")
    return Book.objects.select_related("content").annotate(
        character_count=Count("characters", distinct=True),
        first_character_id=Subquery(first_character.values("id")[:1]),
    )


class BookAdminViewSet(ModelViewSet):
    """관리자용 - 목록/등록/수정/삭제
    TODO: 백엔드 인증 구현 후 AllowAny → IsAdminUser 로 교체
    """
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    filter_backends = [SearchFilter]
    search_fields = ["title", "author", "publisher", "isbn", "description"]

    def get_queryset(self):
        return get_book_queryset()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        fresh_instance = self.get_queryset().get(pk=serializer.instance.pk)
        data = self.get_serializer(fresh_instance).data
        content = BookContent.objects.filter(book=fresh_instance).first()
        data["content"] = BookContentSerializer(content).data if content else None
        if "content" in request.data:
            request_content = request.data["content"]
            if isinstance(request_content, dict):
                request_content = request_content.get("content", "")
            data["content"] = {"content": request_content}
        return Response(data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


class BookViewSet(ReadOnlyModelViewSet):
    """사용자용 - 목록/상세 조회"""
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter]
    search_fields = ["title", "author", "publisher", "isbn", "description"]

    def get_queryset(self):
        return get_book_queryset()
