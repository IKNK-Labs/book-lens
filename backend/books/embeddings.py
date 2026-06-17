"""BGE-M3 embedding helpers for book content and search queries."""

from __future__ import annotations

import os
from typing import Any


BGE_M3_MODEL_NAME = os.environ.get("BGE_M3_MODEL_NAME", "BAAI/bge-m3")
BGE_M3_EMBEDDING_DIMENSIONS = 1024
BGE_M3_DEFAULT_BATCH_SIZE = 12
BGE_M3_DEFAULT_MAX_LENGTH = 8192

_model: Any | None = None


class EmbeddingError(RuntimeError):
    """Raised when BGE-M3 returns an unexpected embedding result."""


def get_embedding(text: str) -> list[float]:
    embeddings = get_embeddings([text])
    return embeddings[0]


def get_embeddings(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    normalized_texts = [_normalize_text(text) for text in texts]
    model = get_embedding_model()
    result = model.encode(
        normalized_texts,
        batch_size=_env_int("BGE_M3_BATCH_SIZE", BGE_M3_DEFAULT_BATCH_SIZE),
        max_length=_env_int("BGE_M3_MAX_LENGTH", BGE_M3_DEFAULT_MAX_LENGTH),
        return_dense=True,
        return_sparse=False,
        return_colbert_vecs=False,
    )

    dense_vectors = _get_dense_vectors(result)
    embeddings = [_coerce_vector(vector) for vector in dense_vectors]
    if len(embeddings) != len(normalized_texts):
        raise EmbeddingError("BGE-M3 returned a different number of embeddings")

    return embeddings


def get_embedding_model() -> Any:
    global _model

    if _model is None:
        from FlagEmbedding import BGEM3FlagModel

        _model = BGEM3FlagModel(
            BGE_M3_MODEL_NAME,
            use_fp16=_env_bool("BGE_M3_USE_FP16", False),
        )

    return _model


def reset_embedding_model() -> None:
    global _model
    _model = None


def _normalize_text(text: str) -> str:
    normalized = " ".join(text.split())
    if not normalized:
        raise ValueError("text must not be empty")
    return normalized


def _get_dense_vectors(result: Any) -> Any:
    if isinstance(result, dict) and "dense_vecs" in result:
        return result["dense_vecs"]
    raise EmbeddingError("BGE-M3 result does not contain dense_vecs")


def _coerce_vector(vector: Any) -> list[float]:
    if hasattr(vector, "tolist"):
        vector = vector.tolist()

    values = [float(value) for value in vector]
    if len(values) != BGE_M3_EMBEDDING_DIMENSIONS:
        raise EmbeddingError(
            f"expected {BGE_M3_EMBEDDING_DIMENSIONS} dimensions, got {len(values)}"
        )

    return values


def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    value = os.environ.get(name)
    if value is None:
        return default
    return int(value)
