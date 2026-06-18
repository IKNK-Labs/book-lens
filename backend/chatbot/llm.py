from __future__ import annotations

import os
from typing import Any, Protocol


class ChatLLM(Protocol):
    def invoke(self, messages: list[Any]) -> Any:
        ...


def get_default_llm() -> ChatLLM:
    api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY is not configured.")

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError as exc:
        raise RuntimeError(
            "langchain-google-genai is required for the BookLens chatbot."
        ) from exc

    return ChatGoogleGenerativeAI(
        model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
        google_api_key=api_key,
        temperature=float(os.environ.get("GEMINI_TEMPERATURE", "0.4")),
    )


def invoke_text(llm: ChatLLM, messages: list[Any]) -> str:
    result = llm.invoke(messages)
    content = getattr(result, "content", result)
    if isinstance(content, list):
        return "".join(_content_part_to_text(part) for part in content).strip()
    return str(content).strip()


def make_message(role: str, content: str) -> Any:
    try:
        if role == "system":
            from langchain_core.messages import SystemMessage

            return SystemMessage(content=content)
        from langchain_core.messages import HumanMessage

        return HumanMessage(content=content)
    except ImportError:
        return {"role": role, "content": content}


def _content_part_to_text(part: Any) -> str:
    if isinstance(part, str):
        return part
    if isinstance(part, dict):
        return str(part.get("text") or part.get("content") or "")
    return str(part)

