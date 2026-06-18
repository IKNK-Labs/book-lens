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
Random digits, random letters, keyboard mashing, typo-only text, or meaningless input is not forbidden. Classify it as counseling.
JSON schema: {"category":"story|counseling|forbidden"}"""


def classify_question_node(state: ChatState, *, llm: ChatLLM) -> ChatState:
    try:
        text = invoke_text(
            llm,
            [
                make_message("system", CLASSIFICATION_PROMPT),
                make_message("human", state["user_message"]),
            ],
        )
        category = _parse_category(text)
    except Exception:
        category = "counseling" if is_low_information_message(state["user_message"]) else "story"
    if category == "forbidden" and is_low_information_message(state["user_message"]):
        category = "counseling"
    return {"category": category}


def load_context_node(state: ChatState, *, repository: ChatbotRepository) -> ChatState:
    forbidden_rules = repository.load_forbidden_rules()
    category = state.get("category", "story")
    input_rule_severity = get_forbidden_severity(
        state.get("user_message", ""),
        forbidden_rules,
        target="user_input",
    )
    if input_rule_severity == ForbiddenRule.SEVERITY_BLOCK:
        category = "forbidden"
    elif input_rule_severity in {
        ForbiddenRule.SEVERITY_WARN,
        ForbiddenRule.SEVERITY_INFO,
    } and category == "forbidden":
        category = "counseling"

    return {
        "persona": repository.load_persona(state["character_id"]),
        "forbidden_rules": forbidden_rules,
        "user_preference": repository.load_user_preference(state.get("user_id")),
        "fallback_response": repository.get_forbidden_fallback(),
        "is_flagged": False,
        "input_rule_severity": input_rule_severity or "",
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
    try:
        response = invoke_text(
            llm,
            [
                make_message("system", state["system_prompt"]),
                make_message("human", state["user_message"]),
            ],
        )
    except Exception:
        response = _fallback_character_response(state)
    return {"response": _strip_markdown_shapes(response)}


def forbidden_filter_node(state: ChatState) -> ChatState:
    response = state.get("response", "")
    output_rule_severity = get_forbidden_severity(
        response,
        state.get("forbidden_rules", []),
        target="bot_output",
    )
    if output_rule_severity == ForbiddenRule.SEVERITY_BLOCK:
        return {
            "response": state.get("fallback_response", ""),
            "is_flagged": True,
        }

    response = _apply_severity_notice(
        response,
        state.get("input_rule_severity", "") or output_rule_severity,
    )
    return {
        "response": response,
        "is_flagged": output_rule_severity == ForbiddenRule.SEVERITY_WARN
        or state.get("input_rule_severity") == ForbiddenRule.SEVERITY_WARN,
    }


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
    return get_forbidden_severity(text, rules, target=target) is not None


def get_forbidden_severity(
    text: str,
    rules: list[dict[str, Any]],
    *,
    target: str,
) -> str | None:
    matched_severity: str | None = None
    for rule in rules:
        if not _rule_applies_to_target(rule, target):
            continue
        pattern = str(rule.get("pattern") or "").strip()
        if not pattern:
            continue
        rule_type = rule.get("rule_type") or ForbiddenRule.RULE_TYPE_WORD
        if rule_type == ForbiddenRule.RULE_TYPE_REGEX:
            try:
                matched = bool(re.search(pattern, text, flags=re.IGNORECASE))
            except re.error:
                continue
        else:
            matched = pattern.lower() in text.lower()

        if matched:
            severity = rule.get("severity") or ForbiddenRule.SEVERITY_WARN
            matched_severity = _higher_severity(matched_severity, str(severity))
            if matched_severity == ForbiddenRule.SEVERITY_BLOCK:
                return matched_severity
    return matched_severity


def is_low_information_message(text: str) -> bool:
    normalized = text.strip()
    if not normalized:
        return False

    compact = re.sub(r"\s+", "", normalized)
    if len(compact) < 3:
        return False

    if re.fullmatch(r"\d+", compact):
        return True

    if re.fullmatch(r"[A-Za-z]+", compact):
        vowels = sum(1 for char in compact.lower() if char in "aeiou")
        return len(compact) <= 12 and vowels <= max(1, len(compact) // 4)

    if re.fullmatch(r"[A-Za-z0-9]+", compact):
        return len(compact) <= 16

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


def _higher_severity(current: str | None, candidate: str) -> str:
    order = {
        ForbiddenRule.SEVERITY_INFO: 1,
        ForbiddenRule.SEVERITY_WARN: 2,
        ForbiddenRule.SEVERITY_BLOCK: 3,
    }
    if current is None:
        return candidate
    return candidate if order.get(candidate, 0) > order.get(current, 0) else current


def _apply_severity_notice(response: str, severity: str | None) -> str:
    if severity == ForbiddenRule.SEVERITY_WARN:
        return (
            f"{response} 다만 그 말은 조심해서 써야 해요. "
            "서로 다치지 않게 더 부드러운 말로 이야기해 볼까요?"
        )
    if severity == ForbiddenRule.SEVERITY_INFO:
        return f"{response} 참고로 그 표현은 상황에 따라 조심해서 쓰면 좋아요."
    return response


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


def _fallback_character_response(state: ChatState) -> str:
    persona = state.get("persona", {})
    character_name = str(persona.get("character_name") or "제가")
    if is_low_information_message(state.get("user_message", "")):
        return f"{character_name}가 잘 알아듣지 못했어요. 조금 더 자세히 말해 줄래요?"
    return f"{character_name}가 지금은 대답을 만들기 어려워요. 잠시 뒤에 다시 이야기해 줄래요?"
