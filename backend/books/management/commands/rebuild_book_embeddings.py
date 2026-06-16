"""Development utility to manually rebuild BGE-M3 embeddings.

This command is intended for local testing and one-off backfills before the
embedding pipeline is connected to an automated background job.
"""

from django.core.management.base import BaseCommand, CommandError

from books.models import BookContent
from books.services import rebuild_book_content_chunks


class Command(BaseCommand):
    help = "Development utility: manually rebuild pgvector embeddings for book content records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--book-id",
            type=int,
            help="Rebuild embeddings for a single book id.",
        )
        parser.add_argument(
            "--failed-only",
            action="store_true",
            help="Only rebuild records whose embed_status is failed.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show target records without generating embeddings.",
        )

    def handle(self, *args, **options):
        queryset = self._target_queryset(
            book_id=options.get("book_id"),
            failed_only=options.get("failed_only", False),
        )
        total = queryset.count()

        if options.get("dry_run"):
            self.stdout.write(f"Target book content records: {total}")
            for book_content in queryset:
                self.stdout.write(
                    f"- book_content_id={book_content.id} book_id={book_content.book_id}"
                )
            return

        completed = 0
        failed = 0
        for book_content in queryset.iterator():
            try:
                result = rebuild_book_content_chunks(book_content)
            except Exception as exc:
                failed += 1
                self.stderr.write(
                    f"FAILED book_content_id={book_content.id}: {exc}"
                )
                continue

            completed += 1
            self.stdout.write(
                "OK "
                f"book_content_id={result.book_content_id} "
                f"chunks={result.chunk_count} "
                f"status={result.embed_status}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Embedding rebuild finished: total={total} completed={completed} failed={failed}"
            )
        )

    def _target_queryset(self, *, book_id: int | None, failed_only: bool):
        queryset = BookContent.objects.select_related("book").order_by("id")
        if book_id is not None:
            queryset = queryset.filter(book_id=book_id)
            if not queryset.exists():
                raise CommandError(f"No book content found for book id {book_id}")
        if failed_only:
            queryset = queryset.filter(embed_status="failed")
        return queryset
