import json
import logging
import os
import re

from google import genai
from google.genai import types
from django.db.models import Count, OuterRef, Subquery
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from characters.models import Character

from .models import Book, BookContent

from .search import VectorSearchError, search_book_content_chunks
from .serializers import (
    BookContentSerializer,
    BookSerializer,
    BookVectorSearchRequestSerializer,
    BookVectorSearchResultSerializer,
)
from .services import rebuild_book_content_chunks

logger = logging.getLogger(__name__)

_SCAN_PROMPT = """ISBN이 주어지면 해당 동화책 정보를 아래 JSON 형식으로만 응답하세요. 다른 설명은 쓰지 마세요.

중요: description 필드는 공백 포함 200자를 절대 초과하지 마세요. 한 두 문장으로 핵심만 요약하세요.

{{
  "title": "동화책 제목",
  "author": "원작자 이름",
  "publisher": "대표 출판사 이름",
  "description": "줄거리 핵심 요약, 공백 포함 200자 이내, 한국어, 두 문장 이내",
  "content": "동화 본문 (아이 친화적 문체, 500자~1000자, 한국어)"
}}

ISBN: "{isbn}"
"""

_GENERATE_PROMPT = """동화책 제목이 주어지면 아래 JSON 형식으로만 응답하세요. 다른 설명은 쓰지 마세요.

중요: description 필드는 공백 포함 200자를 절대 초과하지 마세요. 한 두 문장으로 핵심만 요약하세요.

{{
  "author": "원작자 이름",
  "publisher": "대표 출판사 이름",
  "description": "줄거리 핵심 요약, 공백 포함 200자 이내, 한국어, 두 문장 이내",
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
            logger.warning("Book generation AI response parsing failed")
            return Response({"error": "AI 응답을 파싱할 수 없습니다."}, status=500)

        description = data.get("description", "")
        if len(description) > 200:
            # 200자 이내 마지막 문장 경계(다./요./다!/요!)에서 자름
            cutoff = description[:200]
            last_end = max(cutoff.rfind("다."), cutoff.rfind("요."), cutoff.rfind("다!"), cutoff.rfind("요!"))
            description = cutoff[:last_end + 2] if last_end > 50 else cutoff[:200]

        return Response({
            "author": data.get("author", ""),
            "publisher": data.get("publisher", ""),
            "description": description,
            "content": data.get("content", ""),
        })


def get_book_queryset():
    first_character = Character.objects.filter(book_id=OuterRef("pk")).order_by("id")
    return Book.objects.select_related("content").annotate(
        character_count=Count("characters", distinct=True),
        first_character_id=Subquery(first_character.values("id")[:1]),
    )


class BookScanView(APIView):
    """POST /api/admin/books/scan — ISBN 바코드 이미지 스캔 후 Gemini 자동완성"""
    permission_classes = [AllowAny]

    def post(self, request):
        api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
        if not api_key:
            return Response({"error": "GOOGLE_API_KEY 설정되지 않았습니다."}, status=503)

        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"error": "image 파일을 업로드해주세요."}, status=400)

        try:
            from PIL import Image as _Image
            from pyzbar.pyzbar import decode as _decode
            img = _Image.open(image_file)
            barcodes = _decode(img)
        except Exception as e:
            return Response({"error": f"이미지 처리 중 오류가 발생했습니다: {e}"}, status=400)

        if not barcodes:
            return Response({"error": "바코드를 인식할 수 없습니다."}, status=400)

        isbn = None
        for barcode in barcodes:
            code = barcode.data.decode("utf-8").strip()
            if re.fullmatch(r"\d{10}|\d{13}", code):
                isbn = code
                break

        if not isbn:
            return Response(
                {"error": "ISBN 형식(10자리 또는 13자리 숫자)의 바코드를 인식할 수 없습니다."},
                status=400,
            )

        client = genai.Client(api_key=api_key)
        result = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=_SCAN_PROMPT.format(isbn=isbn),
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=8192,
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
            logger.warning("Book scan AI response parsing failed")
            return Response({"error": "AI 응답을 파싱할 수 없습니다."}, status=500)

        description = data.get("description", "")
        if len(description) > 200:
            cutoff = description[:200]
            last_end = max(cutoff.rfind("다."), cutoff.rfind("요."), cutoff.rfind("다!"), cutoff.rfind("요!"))
            description = cutoff[:last_end + 2] if last_end > 50 else cutoff[:200]

        return Response({
            "isbn": isbn,
            "title": data.get("title", ""),
            "author": data.get("author", ""),
            "publisher": data.get("publisher", ""),
            "description": description,
            "content": data.get("content", ""),
        })


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

    @action(detail=True, methods=["post"], url_path="embed")
    def embed(self, request, pk=None):
        book = self.get_object()
        content = BookContent.objects.filter(book=book).first()
        if content is None:
            return Response({"error": "Book content does not exist."}, status=400)

        result = rebuild_book_content_chunks(content)
        fresh_book = self.get_queryset().get(pk=book.pk)
        data = self.get_serializer(fresh_book).data
        data["embedding"] = {
            "book_content_id": result.book_content_id,
            "chunk_count": result.chunk_count,
            "embed_status": result.embed_status,
        }
        return Response(data)


class BookViewSet(ReadOnlyModelViewSet):
    """사용자용 - 목록/상세 조회"""
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter]
    search_fields = ["title", "author", "publisher", "isbn", "description"]

    def get_queryset(self):
        return get_book_queryset()


class BookVectorSearchView(APIView):
    """POST /api/books/vector-search - search book content chunks with pgvector."""

    permission_classes = [AllowAny]

    def post(self, request):
        request_serializer = BookVectorSearchRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        query = request_serializer.validated_data["query"]
        limit = request_serializer.validated_data["limit"]

        try:
            results = search_book_content_chunks(query, limit=limit)
        except VectorSearchError as exc:
            return Response({"error": str(exc)}, status=400)

        response_serializer = BookVectorSearchResultSerializer(
            [_serialize_vector_result(result) for result in results],
            many=True,
        )
        return Response({"results": response_serializer.data})


class BookCharactersView(APIView):
    """GET /api/books/<pk>/characters — 도서에 등록된 캐릭터 목록"""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({"error": "book not found"}, status=404)

        characters = Character.objects.filter(book=book).order_by("id")
        data = [
            {
                "id": c.id,
                "name": c.name,
                "role": c.role,
                "description": c.description,
                "emoji": c.emoji,
                "profile_image_url": c.profile_image_url,
            }
            for c in characters
        ]
        return Response(data)


def _serialize_vector_result(result):
    chunk = result.chunk
    book = chunk.book_content.book
    return {
        "book_id": book.id,
        "title": book.title,
        "author": book.author,
        "publisher": book.publisher,
        "chunk_id": chunk.id,
        "chunk_index": chunk.chunk_index,
        "content": chunk.content,
        "distance": result.distance,
    }
