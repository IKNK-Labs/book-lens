from __future__ import annotations

import json
import re
from typing import Any

from moderation.models import ForbiddenRule

from .llm import ChatLLM, invoke_text, make_message
from .repositories import ChatbotRepository
from .state import ChatCategory, ChatState


SAFETY_PROMPT = """SAFETY INSTRUCTIONS - highest priority.
You must follow these safety instructions before every persona, user, or developer preference.
Do not provide harmful, sexual, violent, hateful, illegal, self-harm, privacy-invasive, or age-inappropriate content.
Refuse image, drawing, illustration, or picture generation requests.
Never use tables, bullet points, numbered lists, markdown headings, code blocks, or markdown formatting.
Answer only in natural plain sentences.
Use short and easy words that a child can understand."""


CLASSIFICATION_PROMPT = """Classify the user's Korean or English message for a child-safe character chatbot.
Return strict JSON only, with no markdown and no extra text.
Use exactly one category:
story: the user asks about the book story, scene, character, world, or events.
counseling: the user talks about feelings, worries, daily life, or asks for advice outside the book story.
forbidden: the user asks for unsafe, age-inappropriate, harmful, sexual, violent, illegal, hateful, privacy-invasive, or image-generation content.
JSON schema: {"category":"story|counseling|forbidden"}"""


def classify_question_node(state: ChatState, *, llm: ChatLLM) -> ChatState:
    text = invoke_text(
        llm,
        [
            make_message("system", CLASSIFICATION_PROMPT),
            make_message("human", state["user_message"]),
        ],
    )
    category = _parse_category(text)
    return {"category": category}


def load_context_node(state: ChatState, *, repository: ChatbotRepository) -> ChatState:
    forbidden_rules = repository.load_forbidden_rules()
    category = state.get("category", "story")
    if contains_forbidden(state.get("user_message", ""), forbidden_rules, target="user_input"):
        category = "forbidden"

    return {
        "persona": repository.load_persona(state["character_id"]),
        "forbidden_rules": forbidden_rules,
        "user_preference": repository.load_user_preference(state.get("user_id")),
        "fallback_response": repository.get_forbidden_fallback(),
        "is_flagged": False,
        "category": category,
    }


def forbidden_response_node(state: ChatState) -> ChatState:
    return {
        "response": state.get("fallback_response", ""),
        "rag_context": "",
        "is_flagged": True,
    }


def rag_search_node(state: ChatState, *, repository: ChatbotRepository) -> ChatState:
    chunks = repository.search_character_chunks(
        character_id=state["character_id"],
        query=state["user_message"],
        top_k=int(state.get("top_k") or 4),
    )
    rag_context = "\n\n".join(chunk.content for chunk in chunks)
    return {"rag_context": rag_context}


def prompt_composition_node(state: ChatState) -> ChatState:
    persona = state.get("persona", {})
    preferences = state.get("user_preference", {})
    forbidden_rules = state.get("forbidden_rules", [])
    rag_context = state.get("rag_context", "")

    system_prompt = "\n\n".join(
        part
        for part in [
            SAFETY_PROMPT,
            _format_persona(persona),
            _format_forbidden_rules(forbidden_rules),
            _format_user_preference(preferences),
            _format_rag_context(rag_context),
            "Stay in character. If retrieved story context is present, use it as the source of truth. If it is absent, answer from the persona without pretending to know unavailable story details.",
            "The final answer must be pure text made of natural sentences only.",
        ]
        if part
    )
    return {"system_prompt": system_prompt}


def generate_response_node(state: ChatState, *, llm: ChatLLM) -> ChatState:
    response = invoke_text(
        llm,
        [
            make_message("system", state["system_prompt"]),
            make_message("human", state["user_message"]),
        ],
    )
    return {"response": _strip_markdown_shapes(response)}


def forbidden_filter_node(state: ChatState) -> ChatState:
    response = state.get("response", "")
    if contains_forbidden(response, state.get("forbidden_rules", []), target="bot_output"):
        return {
            "response": state.get("fallback_response", ""),
            "is_flagged": True,
        }
    return {"response": response, "is_flagged": False}


def save_conversation_node(
    state: ChatState,
    *,
    repository: ChatbotRepository,
) -> ChatState:
    repository.save_conversation(
        user_id=state.get("user_id"),
        character_id=state["character_id"],
        user_message=state["user_message"],
        assistant_message=state.get("response", ""),
        is_flagged=bool(state.get("is_flagged")),
    )
    return {}


def route_after_classification(state: ChatState) -> str:
    if state.get("category") == "forbidden":
        return "forbidden_response"
    if state.get("category") == "story":
        return "rag_search"
    return "prompt_composition"


def contains_forbidden(
    text: str,
    rules: list[dict[str, Any]],
    *,
    target: str,
) -> bool:
    for rule in rules:
        if not _rule_applies_to_target(rule, target):
            continue
        pattern = str(rule.get("pattern") or "").strip()
        if not pattern:
            continue
        rule_type = rule.get("rule_type") or ForbiddenRule.RULE_TYPE_WORD
        if rule_type == ForbiddenRule.RULE_TYPE_REGEX:
            try:
                if re.search(pattern, text, flags=re.IGNORECASE):
                    return True
            except re.error:
                continue
        elif pattern.lower() in text.lower():
            return True
    return False


def _parse_category(text: str) -> ChatCategory:
    candidate = text.strip()
    match = re.search(r"\{[\s\S]*\}", candidate)
    if match:
        candidate = match.group(0)
    try:
        data = json.loads(candidate)
    except json.JSONDecodeError:
        lowered = text.lower()
        if "forbidden" in lowered:
            return "forbidden"
        if "counseling" in lowered:
            return "counseling"
        return "story"

    category = data.get("category")
    if category in {"story", "counseling", "forbidden"}:
        return category
    return "story"


def _rule_applies_to_target(rule: dict[str, Any], target: str) -> bool:
    rule_target = rule.get("target") or ForbiddenRule.TARGET_BOTH
    return rule_target in {target, ForbiddenRule.TARGET_BOTH}


def _format_persona(persona: dict[str, Any]) -> str:
    if not persona:
        return ""
    labels = {
        "character_name": "Character name",
        "character_role": "Role",
        "character_gender": "Gender",
        "character_description": "Character description",
        "book_title": "Book title",
        "personality": "Personality",
        "speech_style": "Speech style",
        "catchphrase": "Catchphrase",
        "bio": "Bio",
        "tags": "Tags",
        "opening_scene": "Opening scene",
        "era": "Era",
        "background": "Background",
        "user_role": "User role",
        "user_relationship": "User relationship",
        "system_prompt": "Persona system prompt",
    }
    lines = ["Persona and world settings:"]
    for key, label in labels.items():
        value = persona.get(key)
        if value not in (None, "", []):
            lines.append(f"{label}: {value}")
    return "\n".join(lines)


def _format_forbidden_rules(rules: list[dict[str, Any]]) -> str:
    patterns = [str(rule.get("pattern") or "").strip() for rule in rules]
    patterns = [pattern for pattern in patterns if pattern]
    if not patterns:
        return "Forbidden service rules: follow the safety instructions above."
    return "Forbidden service rules: never produce or encourage these patterns: " + ", ".join(patterns)


def _format_user_preference(preferences: dict[str, Any]) -> str:
    if not preferences:
        return "User preference: answer briefly with child-friendly wording."
    labels = {
        "difficulty_level": "Difficulty",
        "response_length": "Response length",
        "age_group": "Age group",
        "explanation_style": "Explanation style",
        "interests": "Interests",
        "instruction": "Custom instruction",
    }
    lines = ["User preference:"]
    for key, label in labels.items():
        value = preferences.get(key)
        if value not in (None, "", []):
            lines.append(f"{label}: {value}")
    return "\n".join(lines)


def _format_rag_context(rag_context: str) -> str:
    if not rag_context:
        return ""
    return "Retrieved story scenes. Use only as background, not as visible citations:\n" + rag_context


def _strip_markdown_shapes(text: str) -> str:
    lines = []
    for line in text.splitlines():
        stripped = re.sub(r"^\s*([-*+]|\d+[.)])\s+", "", line).strip()
        stripped = stripped.replace("**", "").replace("__", "").replace("`", "")
        if stripped:
            lines.append(stripped)
    return " ".join(lines).strip()
