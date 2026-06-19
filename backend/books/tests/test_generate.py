"""Unit tests for BookGenerateView and BookAdminViewSet.

Run:
    cd backend
    pytest books/tests/test_generate.py -v
"""

import json
import os
from unittest.mock import MagicMock, patch

from rest_framework import status
from rest_framework.test import APITestCase

from books.models import Book


def _mock_genai_result(text: str) -> MagicMock:
    result = MagicMock()
    result.text = text
    return result


class BookGenerateViewTests(APITestCase):
    """POST /api/admin/books/generate — Gemini 자동완성 뷰 단위 테스트."""

    URL = "/api/admin/books/generate"

    def _post(self, data: dict, api_key: str = "fake-key"):
        with patch.dict("os.environ", {"GOOGLE_API_KEY": api_key}):
            return self.client.post(self.URL, data, format="json")

    @patch("books.views.genai.Client")
    def test_generate_returns_required_fields(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = _mock_genai_result(
            json.dumps({
                "author": "앙투안 드 생텍쥐페리",
                "publisher": "갈리마르",
                "description": "사막에 불시착한 조종사가 만난 어린왕자 이야기.",
                "content": "옛날 옛날에 아주 먼 별에 어린왕자가 살았습니다.",
            })
        )

        response = self._post({"title": "어린왕자"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for field in ("author", "publisher", "description", "content"):
            self.assertIn(field, response.data)
            self.assertTrue(response.data[field], f"'{field}' 필드가 비어 있습니다.")

    def test_generate_missing_title_returns_400(self):
        response = self._post({})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    @patch("books.views.genai.Client")
    def test_generate_invalid_json_returns_500(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = _mock_genai_result(
            "이것은 JSON이 아닙니다"
        )

        response = self._post({"title": "어린왕자"})

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)

    def test_generate_missing_api_key_returns_503(self):
        with patch.dict("os.environ", {"GOOGLE_API_KEY": ""}):
            response = self.client.post(self.URL, {"title": "어린왕자"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("error", response.data)


class BookAdminViewSetTests(APITestCase):
    """GET/POST/DELETE /api/admin/books — 관리자 CRUD 단위 테스트."""

    LIST_URL = "/api/admin/books"

    def _payload(self, suffix: str = "t1", **overrides) -> dict:
        data = {
            "title": f"테스트동화 {suffix}",
            "author": "테스트작가",
            "publisher": "테스트출판사",
            "description": "짧은 줄거리 요약.",
        }
        data.update(overrides)
        return data

    def test_create_book_success(self):
        response = self.client.post(self.LIST_URL, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Book.objects.filter(id=response.data["id"]).exists())

    def test_create_book_missing_required_field_returns_400(self):
        data = self._payload()
        del data["author"]

        response = self.client.post(self.LIST_URL, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_books_returns_all(self):
        Book.objects.create(**self._payload("a"))
        Book.objects.create(**self._payload("b"))

        response = self.client.get(self.LIST_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_delete_book(self):
        book = Book.objects.create(**self._payload("del"))

        response = self.client.delete(f"{self.LIST_URL}/{book.id}")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=book.id).exists())
