"""Tests for book content embedding service helpers."""

from django.test import SimpleTestCase
from unittest.mock import patch

from books.chunking import TextChunk
from books import services
from books.services import (
    ChunkEmbeddingError,
    RebuildResult,
    rebuild_book_content_chunks,
    _validate_embedding_count,
)


class FakeBookContent:
    id = 10

    def __init__(self, content):
        self.content = content


class EmbeddingServiceHelperTests(SimpleTestCase):
    def test_validate_embedding_count_accepts_matching_lengths(self):
        chunks = [
            TextChunk(chunk_index=0, content="first"),
            TextChunk(chunk_index=1, content="second"),
        ]
        embeddings = [[0.0], [1.0]]

        _validate_embedding_count(chunks, embeddings)

    def test_validate_embedding_count_rejects_mismatch(self):
        chunks = [TextChunk(chunk_index=0, content="first")]
        embeddings = []

        with self.assertRaises(ChunkEmbeddingError):
            _validate_embedding_count(chunks, embeddings)


class RebuildBookContentChunksTests(SimpleTestCase):
    def test_rebuild_empty_content_replaces_chunks_with_empty_status(self):
        book_content = FakeBookContent(" ")

        with patch.object(services, "_replace_chunks") as replace_chunks:
            replace_chunks.return_value = RebuildResult(
                book_content_id=book_content.id,
                chunk_count=0,
                embed_status=services.EMBED_STATUS_EMPTY,
            )

            result = rebuild_book_content_chunks(
                book_content,
                embedding_func=lambda texts: self.fail("embedding should not run"),
            )

        self.assertEqual(result.embed_status, services.EMBED_STATUS_EMPTY)
        replace_chunks.assert_called_once_with(
            book_content,
            [],
            [],
            embed_status=services.EMBED_STATUS_EMPTY,
        )

    def test_rebuild_embeds_chunks_and_stores_completed_status(self):
        book_content = FakeBookContent("first.\n\nsecond.")

        with (
            patch.object(services, "_set_book_content_status") as set_status,
            patch.object(services, "_replace_chunks") as replace_chunks,
        ):
            replace_chunks.return_value = RebuildResult(
                book_content_id=book_content.id,
                chunk_count=2,
                embed_status=services.EMBED_STATUS_COMPLETED,
            )

            result = rebuild_book_content_chunks(
                book_content,
                embedding_func=lambda texts: [[0.0]],
            )

        self.assertEqual(result.embed_status, services.EMBED_STATUS_COMPLETED)
        set_status.assert_called_once_with(book_content, services.EMBED_STATUS_PROCESSING)
        replace_chunks.assert_called_once()
        _, chunks, embeddings = replace_chunks.call_args.args
        self.assertEqual([chunk.content for chunk in chunks], ["first.\n\nsecond."])
        self.assertEqual(embeddings, [[0.0]])
        self.assertEqual(
            replace_chunks.call_args.kwargs["embed_status"],
            services.EMBED_STATUS_COMPLETED,
        )

    def test_rebuild_marks_failed_when_embedding_fails(self):
        book_content = FakeBookContent("content")

        def raise_error(texts):
            raise RuntimeError("embedding failed")

        with patch.object(services, "_set_book_content_status") as set_status:
            with self.assertRaises(RuntimeError):
                rebuild_book_content_chunks(book_content, embedding_func=raise_error)

        self.assertEqual(
            [call.args for call in set_status.call_args_list],
            [
                (book_content, services.EMBED_STATUS_PROCESSING),
                (book_content, services.EMBED_STATUS_FAILED),
            ],
        )
