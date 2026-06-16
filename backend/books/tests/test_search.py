"""Tests for pgvector book content search helpers."""

from django.test import SimpleTestCase

from books import search
from books.embeddings import BGE_M3_EMBEDDING_DIMENSIONS


class VectorSearchValidationTests(SimpleTestCase):
    def test_validate_limit_rejects_zero(self):
        with self.assertRaises(search.VectorSearchError):
            search._validate_limit(0)

    def test_validate_embedding_rejects_wrong_dimension(self):
        with self.assertRaises(search.VectorSearchError):
            search._validate_embedding([0.0, 1.0])

    def test_validate_embedding_rejects_non_numeric_values(self):
        embedding = [0.0] * BGE_M3_EMBEDDING_DIMENSIONS
        embedding[0] = "not-a-number"

        with self.assertRaises(search.VectorSearchError):
            search._validate_embedding(embedding)

    def test_search_query_uses_embedding_function(self):
        expected_embedding = [0.0] * BGE_M3_EMBEDDING_DIMENSIONS

        def fake_embedding_func(query):
            self.assertEqual(query, "adventure")
            return expected_embedding

        original = search.search_book_content_chunks_by_embedding
        calls = []

        def fake_search_by_embedding(query_embedding, *, limit):
            calls.append({"query_embedding": query_embedding, "limit": limit})
            return []

        search.search_book_content_chunks_by_embedding = fake_search_by_embedding
        try:
            result = search.search_book_content_chunks(
                "adventure",
                limit=3,
                embedding_func=fake_embedding_func,
            )
        finally:
            search.search_book_content_chunks_by_embedding = original

        self.assertEqual(result, [])
        self.assertEqual(calls, [{"query_embedding": expected_embedding, "limit": 3}])
