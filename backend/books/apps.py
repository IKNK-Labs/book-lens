from django.apps import AppConfig


class BooksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "books"
    _preload_attempted = False

    def ready(self) -> None:
        if BooksConfig._preload_attempted:
            return

        BooksConfig._preload_attempted = True

        from .embeddings import preload_embedding_dependencies

        try:
            preload_embedding_dependencies()
        except Exception as exc:
            print(
                f"[books] BGE-M3 preload failed: {type(exc).__name__}: {exc}",
                flush=True,
            )
            raise
