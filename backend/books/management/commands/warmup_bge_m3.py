"""Development utility to warm up the BGE-M3 embedding model.

This command validates that the model can be loaded and can generate a
1024-dimensional embedding before search traffic depends on it.
"""

from django.core.management.base import BaseCommand, CommandError

from books.embeddings import BGE_M3_EMBEDDING_DIMENSIONS, get_embedding


class Command(BaseCommand):
    help = "Development utility: load BGE-M3 and run one sample embedding."

    def add_arguments(self, parser):
        parser.add_argument(
            "--text",
            default="BookLens BGE-M3 warm up",
            help="Sample text used for the warm-up embedding.",
        )

    def handle(self, *args, **options):
        text = options["text"]

        try:
            embedding = get_embedding(text)
        except Exception as exc:
            raise CommandError(f"BGE-M3 warm-up failed: {exc}") from exc

        if len(embedding) != BGE_M3_EMBEDDING_DIMENSIONS:
            raise CommandError(
                "BGE-M3 warm-up returned "
                f"{len(embedding)} dimensions; expected {BGE_M3_EMBEDDING_DIMENSIONS}."
            )

        self.stdout.write(
            self.style.SUCCESS(
                "BGE-M3 warm-up completed: "
                f"dimensions={len(embedding)} sample_text={text!r}"
            )
        )
