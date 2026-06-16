"""Utilities for splitting book content into embedding-ready text chunks."""

from __future__ import annotations

from dataclasses import dataclass
import re


DEFAULT_CHUNK_MAX_CHARS = 900
DEFAULT_CHUNK_OVERLAP_CHARS = 120

_SENTENCE_RE = re.compile(r"[^.!?。！？\n]+(?:[.!?。！？]+|$)")


@dataclass(frozen=True)
class TextChunk:
    chunk_index: int
    content: str


def chunk_text(
    text: str,
    *,
    max_chars: int = DEFAULT_CHUNK_MAX_CHARS,
    overlap_chars: int = DEFAULT_CHUNK_OVERLAP_CHARS,
) -> list[TextChunk]:
    """Split book content into stable chunks for dense embedding."""
    _validate_chunk_options(max_chars=max_chars, overlap_chars=overlap_chars)

    normalized = _normalize_text(text)
    if not normalized:
        return []

    units = _split_into_units(normalized, max_chars=max_chars)
    chunks: list[str] = []
    current: list[str] = []

    for unit in units:
        next_len = _joined_len(current, unit)
        if current and next_len > max_chars:
            chunk_content = _join_units(current)
            chunks.append(chunk_content)
            current = _overlap_seed(chunk_content, overlap_chars=overlap_chars)
            if current and _joined_len(current, unit) > max_chars:
                current = []

        current.append(unit)

    if current:
        chunks.append(_join_units(current))

    return [
        TextChunk(chunk_index=index, content=content)
        for index, content in enumerate(chunks)
    ]


def _validate_chunk_options(*, max_chars: int, overlap_chars: int) -> None:
    if max_chars <= 0:
        raise ValueError("max_chars must be greater than 0")
    if overlap_chars < 0:
        raise ValueError("overlap_chars must be greater than or equal to 0")
    if overlap_chars >= max_chars:
        raise ValueError("overlap_chars must be smaller than max_chars")


def _normalize_text(text: str) -> str:
    lines: list[str] = []
    for raw_line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        line = re.sub(r"[ \t]+", " ", raw_line.strip())
        if line:
            lines.append(line)
        elif lines and lines[-1] != "":
            lines.append("")

    normalized = "\n".join(lines).strip()
    return re.sub(r"\n{3,}", "\n\n", normalized)


def _split_into_units(text: str, *, max_chars: int) -> list[str]:
    units: list[str] = []
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]

    for paragraph in paragraphs:
        if len(paragraph) <= max_chars:
            units.append(paragraph)
        else:
            units.extend(_split_long_paragraph(paragraph, max_chars=max_chars))

    return units


def _split_long_paragraph(paragraph: str, *, max_chars: int) -> list[str]:
    sentences = [
        match.group(0).strip()
        for match in _SENTENCE_RE.finditer(paragraph)
        if match.group(0).strip()
    ]
    if not sentences:
        return _split_long_text(paragraph, max_chars=max_chars)

    units: list[str] = []
    current: list[str] = []

    for sentence in sentences:
        if len(sentence) > max_chars:
            if current:
                units.append(_join_units(current, separator=" "))
                current = []
            units.extend(_split_long_text(sentence, max_chars=max_chars))
            continue

        if current and _joined_len(current, sentence, separator=" ") > max_chars:
            units.append(_join_units(current, separator=" "))
            current = []

        current.append(sentence)

    if current:
        units.append(_join_units(current, separator=" "))

    return units


def _split_long_text(text: str, *, max_chars: int) -> list[str]:
    pieces: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + max_chars, text_len)
        if end < text_len:
            split_at = text.rfind(" ", start + 1, end)
            if split_at > start + max_chars // 2:
                end = split_at

        piece = text[start:end].strip()
        if piece:
            pieces.append(piece)

        start = end
        while start < text_len and text[start].isspace():
            start += 1

    return pieces


def _overlap_seed(content: str, *, overlap_chars: int) -> list[str]:
    if overlap_chars <= 0:
        return []

    tail = content[-overlap_chars:].strip()
    if not tail:
        return []
    return [tail]


def _joined_len(
    units: list[str],
    next_unit: str,
    *,
    separator: str = "\n\n",
) -> int:
    if not units:
        return len(next_unit)
    return len(separator.join([*units, next_unit]))


def _join_units(units: list[str], *, separator: str = "\n\n") -> str:
    return separator.join(unit.strip() for unit in units if unit.strip()).strip()
