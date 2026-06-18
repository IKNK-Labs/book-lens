from __future__ import annotations

import importlib.util
from types import SimpleNamespace

from django.test import SimpleTestCase

from chatbot.graph import build_chat_graph
from chatbot.repositories import RAGChunk


class FakeLLM:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def invoke(self, messages):
        self.calls.append(messages)
        return SimpleNamespace(content=self.responses.pop(0))


class FakeRepository:
    def __init__(self):
        self.saved = []
        self.search_calls = []

    def load_persona(self, character_id):
        return {
            "character_id": character_id,
            "character_name": "Dorothy",
            "book_title": "Oz",
            "speech_style": "warm",
        }

    def load_forbidden_rules(self):
        return [{"pattern": "unsafe", "rule_type": "word", "target": "bot_output"}]

    def get_forbidden_fallback(self):
        return "fallback"

    def load_user_preference(self, user_id):
        return {"age_group": "child"}

    def search_character_chunks(self, *, character_id, query, top_k):
        self.search_calls.append((character_id, query, top_k))
        return [RAGChunk(content="Dorothy met a kind friend.", distance=0.1, chunk_index=0)]

    def save_conversation(self, **kwargs):
        self.saved.append(kwargs)


class ChatbotGraphTests(SimpleTestCase):
    def test_story_path_runs_rag_and_saves(self):
        if importlib.util.find_spec("langgraph") is None:
            self.skipTest("langgraph is not installed")

        llm = FakeLLM('{"category":"story"}', "Dorothy smiles and answers kindly.")
        repository = FakeRepository()
        graph = build_chat_graph(llm=llm, repository=repository)

        result = graph.invoke(
            {
                "user_id": 1,
                "character_id": 7,
                "user_message": "What happened in the story?",
                "top_k": 3,
            }
        )

        self.assertEqual(result["category"], "story")
        self.assertEqual(result["response"], "Dorothy smiles and answers kindly.")
        self.assertEqual(repository.search_calls, [(7, "What happened in the story?", 3)])
        self.assertEqual(repository.saved[0]["assistant_message"], result["response"])
        self.assertEqual(len(llm.calls), 2)

    def test_forbidden_path_skips_generation_llm(self):
        if importlib.util.find_spec("langgraph") is None:
            self.skipTest("langgraph is not installed")

        llm = FakeLLM('{"category":"forbidden"}')
        repository = FakeRepository()
        graph = build_chat_graph(llm=llm, repository=repository)

        result = graph.invoke(
            {
                "user_id": 1,
                "character_id": 7,
                "user_message": "draw something unsafe",
                "top_k": 3,
            }
        )

        self.assertEqual(result["category"], "forbidden")
        self.assertEqual(result["response"], "fallback")
        self.assertTrue(result["is_flagged"])
        self.assertEqual(repository.search_calls, [])
        self.assertEqual(len(llm.calls), 1)
