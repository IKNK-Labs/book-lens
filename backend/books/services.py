"""Services for building and storing book content embeddings."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from django.db import transaction

from .chunking import TextChunk, chunk_text
from .embeddings import get_embeddings
from .models import BookContent, BookContentChunk


EMBED_STATUS_EMPTY = "empty"
EMBED_STATUS_PROCESSING = "processing"
EMBED_STATUS_COMPLETED = "completed"
EMBED_STATUS_FAILED = "failed"

EmbeddingFunction = Callable[[list[str]], list[list[float]]]


@dataclass(frozen=True)
class RebuildResult:
    book_content_id: int
    chunk_count: int
    embed_status: str


class ChunkEmbeddingError(RuntimeError):
    """Raised when chunk embedding generation cannot be stored safely."""


def rebuild_book_content_chunks(
    book_content: BookContent,
    *,
    embedding_func: EmbeddingFunction = get_embeddings,
) -> RebuildResult:
    chunks = chunk_text(book_content.content)
    if not chunks:
        return _replace_chunks(book_content, [], [], embed_status=EMBED_STATUS_EMPTY)

    _set_book_content_status(book_content, EMBED_STATUS_PROCESSING)

    try:
        embeddings = embedding_func([chunk.content for chunk in chunks])
        _validate_embedding_count(chunks, embeddings)
    except Exception:
        _set_book_content_status(book_content, EMBED_STATUS_FAILED)
        raise

    return _replace_chunks(
        book_content,
        chunks,
        embeddings,
        embed_status=EMBED_STATUS_COMPLETED,
    )


def _replace_chunks(
    book_content: BookContent,
    chunks: list[TextChunk],
    embeddings: list[list[float]],
    *,
    embed_status: str,
) -> RebuildResult:
    with transaction.atomic():
        book_content.chunks.all().delete()
        if chunks:
            BookContentChunk.objects.bulk_create(
                [
                    BookContentChunk(
                        book_content=book_content,
                        chunk_index=chunk.chunk_index,
                        content=chunk.content,
                        embedding=embedding,
                        embed_status=embed_status,
                    )
                    for chunk, embedding in zip(chunks, embeddings, strict=True)
                ]
            )

        _set_book_content_status(book_content, embed_status)

    return RebuildResult(
        book_content_id=book_content.id,
        chunk_count=len(chunks),
        embed_status=embed_status,
    )


def _validate_embedding_count(
    chunks: list[TextChunk],
    embeddings: list[list[float]],
) -> None:
    if len(chunks) != len(embeddings):
        raise ChunkEmbeddingError(
            f"expected {len(chunks)} embeddings, got {len(embeddings)}"
        )


def _set_book_content_status(book_content: BookContent, embed_status: str) -> None:
    book_content.embed_status = embed_status
    book_content.save(update_fields=["embed_status", "updated_at"])
