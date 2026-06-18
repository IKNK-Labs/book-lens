from __future__ import annotations

from types import SimpleNamespace

from django.test import SimpleTestCase

from chatbot.nodes import (
    classify_question_node,
    contains_forbidden,
    forbidden_filter_node,
    generate_response_node,
    get_forbidden_severity,
    is_low_information_message,
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


class FailingLLM:
    def invoke(self, messages):
        raise RuntimeError("llm failed")


class FakeRepository:
    def __init__(self, severity="block"):
        self.severity = severity

    def load_persona(self, character_id):
        return {"character_id": character_id}

    def load_forbidden_rules(self):
        return [
            {
                "pattern": "blocked",
                "rule_type": "word",
                "target": "user_input",
                "severity": self.severity,
            }
        ]

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

    def test_classify_question_does_not_forbid_random_letters(self):
        llm = FakeLLM('{"category":"forbidden"}')

        result = classify_question_node({"user_message": "asdfwf"}, llm=llm)

        self.assertEqual(result["category"], "counseling")

    def test_classify_question_falls_back_when_llm_fails(self):
        result = classify_question_node({"user_message": "asdfwf"}, llm=FailingLLM())

        self.assertEqual(result["category"], "counseling")

    def test_low_information_message_detection(self):
        self.assertTrue(is_low_information_message("123123"))
        self.assertTrue(is_low_information_message("asdfwf"))
        self.assertFalse(is_low_information_message("안녕"))
        self.assertFalse(is_low_information_message("I feel sad today"))

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
                    {
                        "pattern": "blocked phrase",
                        "rule_type": "phrase",
                        "target": "bot_output",
                        "severity": "block",
                    }
                ],
            }
        )

        self.assertEqual(result["response"], "fallback")
        self.assertTrue(result["is_flagged"])

    def test_forbidden_filter_warn_keeps_response_and_flags(self):
        result = forbidden_filter_node(
            {
                "response": "this has a risky phrase",
                "fallback_response": "fallback",
                "forbidden_rules": [
                    {
                        "pattern": "risky phrase",
                        "rule_type": "phrase",
                        "target": "bot_output",
                        "severity": "warn",
                    }
                ],
            }
        )

        self.assertIn("this has a risky phrase", result["response"])
        self.assertIn("조심", result["response"])
        self.assertTrue(result["is_flagged"])

    def test_forbidden_filter_info_keeps_response_without_flagging(self):
        result = forbidden_filter_node(
            {
                "response": "this has an info phrase",
                "fallback_response": "fallback",
                "forbidden_rules": [
                    {
                        "pattern": "info phrase",
                        "rule_type": "phrase",
                        "target": "bot_output",
                        "severity": "info",
                    }
                ],
            }
        )

        self.assertIn("this has an info phrase", result["response"])
        self.assertIn("참고", result["response"])
        self.assertFalse(result["is_flagged"])

    def test_generate_response_falls_back_when_llm_fails(self):
        result = generate_response_node(
            {
                "system_prompt": "prompt",
                "user_message": "asdfwf",
                "persona": {"character_name": "Belle"},
            },
            llm=FailingLLM(),
        )

        self.assertIn("Belle", result["response"])

    def test_contains_forbidden_honors_target(self):
        rules = [{"pattern": "secret", "rule_type": "word", "target": "user_input"}]

        self.assertFalse(contains_forbidden("secret", rules, target="bot_output"))
        self.assertTrue(contains_forbidden("secret", rules, target="user_input"))

    def test_get_forbidden_severity_uses_highest_match(self):
        rules = [
            {"pattern": "same", "rule_type": "word", "target": "both", "severity": "info"},
            {"pattern": "same", "rule_type": "word", "target": "both", "severity": "warn"},
        ]

        self.assertEqual(get_forbidden_severity("same", rules, target="bot_output"), "warn")

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

    def test_load_context_keeps_warn_rule_from_blocking(self):
        result = load_context_node(
            {
                "category": "forbidden",
                "character_id": 1,
                "user_message": "this is blocked",
                "user_id": 1,
            },
            repository=FakeRepository(severity="warn"),
        )

        self.assertEqual(result["category"], "counseling")
        self.assertEqual(result["input_rule_severity"], "warn")
