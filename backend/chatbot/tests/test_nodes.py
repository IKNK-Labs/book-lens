from __future__ import annotations

from types import SimpleNamespace

from django.test import SimpleTestCase

from chatbot.nodes import (
    classify_question_node,
    contains_forbidden,
    forbidden_filter_node,
    load_context_node,
    prompt_composition_node,
)


class FakeLLM:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def invoke(self, messages):
        self.calls.append(messages)
        return SimpleNamespace(content=self.responses.pop(0))


class FakeRepository:
    def load_persona(self, character_id):
        return {"character_id": character_id}

    def load_forbidden_rules(self):
        return [{"pattern": "blocked", "rule_type": "word", "target": "user_input"}]

    def load_user_preference(self, user_id):
        return {}

    def get_forbidden_fallback(self):
        return "fallback"


class ChatbotNodeTests(SimpleTestCase):
    def test_classify_question_node_parses_json_category(self):
        llm = FakeLLM('{"category":"counseling"}')

        result = classify_question_node({"user_message": "오늘 속상했어"}, llm=llm)

        self.assertEqual(result["category"], "counseling")
        self.assertEqual(len(llm.calls), 1)

    def test_prompt_composition_places_safety_first_and_blocks_markdown(self):
        result = prompt_composition_node(
            {
                "persona": {"character_name": "Alice", "speech_style": "kind"},
                "forbidden_rules": [{"pattern": "bad", "rule_type": "word", "target": "both"}],
                "user_preference": {"age_group": "child", "response_length": "short"},
                "rag_context": "Alice found a small key.",
            }
        )

        prompt = result["system_prompt"]
        self.assertTrue(prompt.startswith("SAFETY INSTRUCTIONS - highest priority."))
        self.assertIn("Never use tables, bullet points, numbered lists", prompt)
        self.assertIn("Refuse image, drawing, illustration, or picture generation requests.", prompt)
        self.assertIn("Alice found a small key.", prompt)

    def test_forbidden_filter_replaces_unsafe_response(self):
        result = forbidden_filter_node(
            {
                "response": "this has a blocked phrase",
                "fallback_response": "fallback",
                "forbidden_rules": [
                    {"pattern": "blocked phrase", "rule_type": "phrase", "target": "bot_output"}
                ],
            }
        )

        self.assertEqual(result["response"], "fallback")
        self.assertTrue(result["is_flagged"])

    def test_contains_forbidden_honors_target(self):
        rules = [{"pattern": "secret", "rule_type": "word", "target": "user_input"}]

        self.assertFalse(contains_forbidden("secret", rules, target="bot_output"))
        self.assertTrue(contains_forbidden("secret", rules, target="user_input"))

    def test_load_context_overrides_category_for_user_input_rule(self):
        result = load_context_node(
            {
                "category": "story",
                "character_id": 1,
                "user_message": "this is blocked",
                "user_id": 1,
            },
            repository=FakeRepository(),
        )

        self.assertEqual(result["category"], "forbidden")
