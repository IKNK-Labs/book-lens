"""Tests for the development-only warmup_bge_m3 command."""

from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import SimpleTestCase


class WarmupBGEM3CommandTests(SimpleTestCase):
    def test_warmup_generates_sample_embedding(self):
        out = StringIO()

        with patch(
            "books.management.commands.warmup_bge_m3.get_embedding",
            return_value=[0.1] * 1024,
        ) as get_embedding:
            call_command("warmup_bge_m3", stdout=out)

        get_embedding.assert_called_once_with("BookLens BGE-M3 warm up")
        self.assertIn("BGE-M3 warm-up completed", out.getvalue())
        self.assertIn("dimensions=1024", out.getvalue())

    def test_warmup_accepts_custom_text(self):
        out = StringIO()

        with patch(
            "books.management.commands.warmup_bge_m3.get_embedding",
            return_value=[0.1] * 1024,
        ) as get_embedding:
            call_command("warmup_bge_m3", "--text", "검색 준비", stdout=out)

        get_embedding.assert_called_once_with("검색 준비")

    def test_warmup_raises_when_embedding_fails(self):
        with patch(
            "books.management.commands.warmup_bge_m3.get_embedding",
            side_effect=RuntimeError("model missing"),
        ):
            with self.assertRaises(CommandError):
                call_command("warmup_bge_m3")

    def test_warmup_raises_for_unexpected_dimensions(self):
        with patch(
            "books.management.commands.warmup_bge_m3.get_embedding",
            return_value=[0.1] * 3,
        ):
            with self.assertRaises(CommandError):
                call_command("warmup_bge_m3")
