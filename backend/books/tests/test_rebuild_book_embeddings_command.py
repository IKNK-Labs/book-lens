"""Tests for the development-only rebuild_book_embeddings command."""

from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import SimpleTestCase

from books.management.commands.rebuild_book_embeddings import Command
from books.services import RebuildResult


class FakeBookContent:
    def __init__(self, id=1, book_id=10, embed_status=""):
        self.id = id
        self.book_id = book_id
        self.embed_status = embed_status


class FakeQuerySet:
    def __init__(self, items):
        self.items = list(items)
        self.filters = []

    def select_related(self, *_args):
        return self

    def order_by(self, *_args):
        return self

    def filter(self, **kwargs):
        filtered = self.items
        if "book_id" in kwargs:
            filtered = [item for item in filtered if item.book_id == kwargs["book_id"]]
        if "embed_status" in kwargs:
            filtered = [
                item for item in filtered if item.embed_status == kwargs["embed_status"]
            ]

        queryset = FakeQuerySet(filtered)
        queryset.filters = [*self.filters, kwargs]
        return queryset

    def exists(self):
        return bool(self.items)

    def count(self):
        return len(self.items)

    def iterator(self):
        return iter(self.items)

    def __iter__(self):
        return iter(self.items)


class FakeManager:
    def __init__(self, items):
        self.queryset = FakeQuerySet(items)

    def select_related(self, *args):
        return self.queryset.select_related(*args)


class RebuildBookEmbeddingsCommandTests(SimpleTestCase):
    def test_target_queryset_filters_by_book_id(self):
        command = Command()

        with patch(
            "books.management.commands.rebuild_book_embeddings.BookContent.objects",
            FakeManager([FakeBookContent(book_id=10), FakeBookContent(book_id=20)]),
        ):
            queryset = command._target_queryset(book_id=20, failed_only=False)

        self.assertEqual([item.book_id for item in queryset], [20])

    def test_target_queryset_raises_for_missing_book_content(self):
        command = Command()

        with patch(
            "books.management.commands.rebuild_book_embeddings.BookContent.objects",
            FakeManager([FakeBookContent(book_id=10)]),
        ):
            with self.assertRaises(CommandError):
                command._target_queryset(book_id=99, failed_only=False)

    def test_dry_run_lists_target_records_without_rebuilding(self):
        out = StringIO()

        with (
            patch(
                "books.management.commands.rebuild_book_embeddings.BookContent.objects",
                FakeManager([FakeBookContent(id=1, book_id=10)]),
            ),
            patch(
                "books.management.commands.rebuild_book_embeddings.rebuild_book_content_chunks"
            ) as rebuild,
        ):
            call_command("rebuild_book_embeddings", "--dry-run", stdout=out)

        rebuild.assert_not_called()
        self.assertIn("Target book content records: 1", out.getvalue())
        self.assertIn("book_content_id=1", out.getvalue())

    def test_rebuild_calls_service_for_each_target(self):
        out = StringIO()
        book_content = FakeBookContent(id=1, book_id=10)

        with (
            patch(
                "books.management.commands.rebuild_book_embeddings.BookContent.objects",
                FakeManager([book_content]),
            ),
            patch(
                "books.management.commands.rebuild_book_embeddings.rebuild_book_content_chunks"
            ) as rebuild,
        ):
            rebuild.return_value = RebuildResult(
                book_content_id=1,
                chunk_count=2,
                embed_status="completed",
            )
            call_command("rebuild_book_embeddings", stdout=out)

        rebuild.assert_called_once_with(book_content)
        self.assertIn("completed=1", out.getvalue())
