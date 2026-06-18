from __future__ import annotations

from typing import Any, Literal, TypedDict


ChatCategory = Literal["story", "counseling", "forbidden"]


class ChatState(TypedDict, total=False):
    user_id: int | str | None
    character_id: int
    user_message: str
    category: ChatCategory
    rag_context: str
    system_prompt: str
    response: str
    is_flagged: bool
    fallback_response: str
    persona: dict[str, Any]
    forbidden_rules: list[dict[str, Any]]
    user_preference: dict[str, Any]
    top_k: int

