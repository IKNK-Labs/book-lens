"""Tests for the book vector search API endpoint."""

from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from books.search import ChunkSearchResult, VectorSearchError
from books.views import BookVectorSearchView


class BookVectorSearchApiTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = BookVectorSearchView.as_view()

    def test_vector_search_returns_serialized_results(self):
        result = ChunkSearchResult(
            chunk=SimpleNamespace(
                id=7,
                chunk_index=2,
                content="용감한 아이가 숲으로 갔어요.",
                book_content=SimpleNamespace(
                    book=SimpleNamespace(
                        id=3,
                        title="숲속 모험",
                        author="작가",
                        publisher="출판사",
                    )
                ),
            ),
            distance=0.12,
        )

        with patch("books.views.search_book_content_chunks", return_value=[result]) as search:
            request = self.factory.post(
                "/api/books/vector-search",
                {"query": "용감한 모험", "limit": 5},
                format="json",
            )
            response = self.view(request)

        self.assertEqual(response.status_code, 200)
        search.assert_called_once_with("용감한 모험", limit=5)
        self.assertEqual(
            response.data,
            {
                "results": [
                    {
                        "book_id": 3,
                        "title": "숲속 모험",
                        "author": "작가",
                        "publisher": "출판사",
                        "chunk_id": 7,
                        "chunk_index": 2,
                        "content": "용감한 아이가 숲으로 갔어요.",
                        "distance": 0.12,
                    }
                ]
            },
        )

    def test_vector_search_rejects_blank_query(self):
        request = self.factory.post(
            "/api/books/vector-search",
            {"query": " ", "limit": 5},
            format="json",
        )
        response = self.view(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("query", response.data)

    def test_vector_search_rejects_too_large_limit(self):
        request = self.factory.post(
            "/api/books/vector-search",
            {"query": "모험", "limit": 100},
            format="json",
        )
        response = self.view(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("limit", response.data)

    def test_vector_search_returns_search_errors_as_bad_request(self):
        with patch(
            "books.views.search_book_content_chunks",
            side_effect=VectorSearchError("invalid embedding"),
        ):
            request = self.factory.post(
                "/api/books/vector-search",
                {"query": "모험"},
                format="json",
            )
            response = self.view(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, {"error": "invalid embedding"})
