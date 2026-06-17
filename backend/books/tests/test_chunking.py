"""Tests for book content chunking behavior."""

from django.test import SimpleTestCase

from books.chunking import TextChunk, chunk_text


class ChunkingTests(SimpleTestCase):
    def test_empty_text_returns_no_chunks(self):
        self.assertEqual(chunk_text(" \n\t "), [])

    def test_short_text_returns_single_normalized_chunk(self):
        chunks = chunk_text("  First line.  \n\n  Second line.  ")

        self.assertEqual(
            chunks,
            [TextChunk(chunk_index=0, content="First line.\n\nSecond line.")],
        )

    def test_long_text_respects_max_chars(self):
        text = " ".join([f"Sentence {index}." for index in range(80)])

        chunks = chunk_text(text, max_chars=120, overlap_chars=0)

        self.assertGreater(len(chunks), 1)
        self.assertEqual(
            [chunk.chunk_index for chunk in chunks],
            list(range(len(chunks))),
        )
        self.assertTrue(all(len(chunk.content) <= 120 for chunk in chunks))

    def test_long_sentence_is_split_without_exceeding_max_chars(self):
        text = "a" * 250

        chunks = chunk_text(text, max_chars=80, overlap_chars=0)

        self.assertEqual(len(chunks), 4)
        self.assertTrue(all(len(chunk.content) <= 80 for chunk in chunks))

    def test_invalid_overlap_raises_error(self):
        with self.assertRaises(ValueError):
            chunk_text("content", max_chars=100, overlap_chars=100)
