"""chat 앱 파이프라인 테스트.

mock 전략:
- LLM (_gemini_client)      → unittest.mock.patch
- Persona, ForbiddenRule    → patch (managed=False, test DB 없음)
- get_embedding (BGE-M3)    → patch
- ConversationLog           → patch (managed=False, test DB 없음)
- Book, Character           → 실제 test DB
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.test import APIClient

from books.models import Book
from characters.models import Character
from moderation.models import ForbiddenRule

from .models import ConversationLog
from .pipeline import (
    _DEFAULT_FALLBACK,
    _SAFETY_RULES,
    build_prompt_node,
    filter_response_node,
    forbidden_return_node,
    run_chat,
)


# ─── 공통 픽스처 ──────────────────────────────────────────────────────────────

def _make_base_state(character_id: int, message: str = "안녕") -> dict:
    return {
        "user_id": "",
        "character_id": character_id,
        "user_message": message,
        "persona": {
            "character_name": "홍길동",
            "book_title": "홍길동전",
            "personality": "용감하고 의리있는",
            "speech_style": "고어체",
            "catchphrase": "의를 위해!",
            "bio": "의적",
            "era": "조선",
            "background": "서자 출신",
            "user_role": "독자",
            "user_relationship": "독자",
            "system_prompt": "",
            "opening_scene": "",
        },
        "book_id": 1,
        "forbidden_rules": [],
        "user_preference": {},
        "category": "counseling",
        "rag_context": "",
        "system_prompt": "",
        "response": "",
        "is_flagged": False,
    }


def _setup_log_mock(mock_log_objects) -> None:
    """ConversationLog.objects mock에 load_history_node 체인을 빈 리스트로 설정."""
    mock_log_objects.filter.return_value.filter.return_value.order_by.return_value.__getitem__ = MagicMock(return_value=[])
    mock_log_objects.filter.return_value.order_by.return_value.__getitem__ = MagicMock(return_value=[])


def _forbidden_rule(pattern: str, rule_type: str, target: str = "both") -> dict:
    return {
        "pattern": pattern,
        "rule_type": rule_type,
        "severity": "block",
        "target": target,
    }


# ─── 1. build_prompt_node 단위 테스트 ─────────────────────────────────────────

class BuildPromptNodeTest(TestCase):

    def test_safety_rules_first_in_prompt(self):
        state = _make_base_state(1)
        result = build_prompt_node(state)
        prompt = result["system_prompt"]
        safety_idx = prompt.find("[안전 지침")
        persona_idx = prompt.find("[캐릭터 설정]")
        self.assertGreater(safety_idx, -1, "안전 지침 섹션이 없음")
        self.assertLess(safety_idx, persona_idx, "안전 지침이 캐릭터 설정보다 앞에 있어야 함")

    def test_no_markdown_rule_in_prompt(self):
        state = _make_base_state(1)
        result = build_prompt_node(state)
        prompt = result["system_prompt"]
        self.assertIn("마크다운", prompt, "마크다운 금지 언급이 없음")
        self.assertIn("[응답 형식 규칙]", prompt, "응답 형식 규칙 섹션이 없음")

    def test_rag_context_included_for_story(self):
        state = _make_base_state(1)
        state["category"] = "story"
        state["rag_context"] = "길동이 산에서 호랑이를 만났다."
        result = build_prompt_node(state)
        self.assertIn("관련 장면 참고", result["system_prompt"])
        self.assertIn("길동이 산에서 호랑이를 만났다.", result["system_prompt"])

    def test_rag_context_excluded_for_counseling(self):
        state = _make_base_state(1)
        state["category"] = "counseling"
        state["rag_context"] = "이 내용은 포함되면 안 됨"
        result = build_prompt_node(state)
        self.assertNotIn("이 내용은 포함되면 안 됨", result["system_prompt"])

    def test_user_preference_included_when_present(self):
        state = _make_base_state(1)
        state["user_preference"] = {
            "difficulty_level": "쉬움",
            "response_length": "짧게",
            "age_group": "초등",
            "explanation_style": "",
            "interests": ["모험", "동물"],
            "instruction": "반말로 해줘",
        }
        result = build_prompt_node(state)
        prompt = result["system_prompt"]
        self.assertIn("쉬움", prompt)
        self.assertIn("모험", prompt)
        self.assertIn("반말로 해줘", prompt)


# ─── 2. filter_response_node 단위 테스트 ─────────────────────────────────────

class FilterResponseNodeTest(TestCase):

    def test_word_type_match_returns_fallback(self):
        state = _make_base_state(1)
        state["response"] = "오늘은 폭력을 써야 할 것 같아."
        state["forbidden_rules"] = [_forbidden_rule("폭력", ForbiddenRule.RULE_TYPE_WORD)]
        result = filter_response_node(state)
        self.assertEqual(result["response"], _DEFAULT_FALLBACK)
        self.assertTrue(result["is_flagged"])

    def test_phrase_type_match_returns_fallback(self):
        state = _make_base_state(1)
        state["response"] = "나쁜 말을 해도 돼."
        state["forbidden_rules"] = [_forbidden_rule("나쁜 말을 해도 돼", ForbiddenRule.RULE_TYPE_PHRASE)]
        result = filter_response_node(state)
        self.assertEqual(result["response"], _DEFAULT_FALLBACK)
        self.assertTrue(result["is_flagged"])

    def test_regex_type_match_returns_fallback(self):
        state = _make_base_state(1)
        state["response"] = "전화번호는 010-1234-5678이야."
        state["forbidden_rules"] = [
            _forbidden_rule(r"\d{3}-\d{4}-\d{4}", ForbiddenRule.RULE_TYPE_REGEX)
        ]
        result = filter_response_node(state)
        self.assertEqual(result["response"], _DEFAULT_FALLBACK)
        self.assertTrue(result["is_flagged"])

    def test_no_violation_passes_through(self):
        state = _make_base_state(1)
        original = "안녕하세요! 오늘도 좋은 하루 보내세요."
        state["response"] = original
        state["forbidden_rules"] = [_forbidden_rule("폭력", ForbiddenRule.RULE_TYPE_WORD)]
        result = filter_response_node(state)
        self.assertEqual(result.get("response", original), original)
        self.assertFalse(result["is_flagged"])

    def test_bot_output_only_rules_are_checked(self):
        """target=user_input 규칙은 응답 필터링에서 무시되어야 함."""
        state = _make_base_state(1)
        state["response"] = "이건 테스트 응답입니다."
        state["forbidden_rules"] = [
            _forbidden_rule("테스트", ForbiddenRule.RULE_TYPE_WORD, target="user_input")
        ]
        result = filter_response_node(state)
        self.assertFalse(result["is_flagged"])

    def test_invalid_regex_does_not_crash(self):
        state = _make_base_state(1)
        state["response"] = "정상 응답"
        state["forbidden_rules"] = [
            _forbidden_rule("[잘못된 regex(", ForbiddenRule.RULE_TYPE_REGEX)
        ]
        result = filter_response_node(state)
        self.assertFalse(result["is_flagged"])


# ─── 3. forbidden_return_node 단위 테스트 ────────────────────────────────────

class ForbiddenReturnNodeTest(TestCase):

    def test_returns_default_fallback(self):
        state = _make_base_state(1)
        result = forbidden_return_node(state)
        self.assertEqual(result["response"], _DEFAULT_FALLBACK)
        self.assertTrue(result["is_flagged"])
        self.assertEqual(result["rag_context"], "")
        self.assertEqual(result["system_prompt"], "")


# ─── 4. 파이프라인 경로 통합 테스트 ──────────────────────────────────────────

class PipelineIntegrationTest(TestCase):

    def setUp(self):
        self.book = Book.objects.create(
            title="홍길동전", author="허균", publisher="민음사"
        )
        self.character = Character.objects.create(
            book=self.book, name="홍길동", role="주인공"
        )

    def _mock_persona_missing(self, mock_persona_objects):
        """Persona.DoesNotExist → Character 기본값 경로."""
        mock_persona_objects.select_related.return_value.get.side_effect = (
            Exception.__new__(type("DoesNotExist", (Exception,), {}))
        )

    @patch("chat.pipeline.ConversationLog.objects")
    @patch("chat.pipeline.Persona.objects")
    @patch("chat.pipeline.ForbiddenRule.objects")
    @patch("chat.pipeline._gemini_client")
    def test_counseling_path_saves_logs(
        self, mock_client, mock_forbidden_objects, mock_persona_objects, mock_log_objects
    ):
        from characters.models import Persona as _Persona

        mock_persona_objects.select_related.return_value.get.side_effect = (
            _Persona.DoesNotExist
        )
        mock_forbidden_objects.filter.return_value = []
        _setup_log_mock(mock_log_objects)

        gemini = mock_client.return_value
        gemini.models.generate_content.side_effect = [
            MagicMock(text='{"category": "counseling"}'),
            MagicMock(text="안녕하세요! 무슨 이야기를 하고 싶으신가요?"),
        ]

        result = run_chat(
            user_id="",
            character_id=self.character.id,
            user_message="안녕",
        )

        self.assertEqual(result["category"], "counseling")
        self.assertIn("response", result)
        self.assertEqual(gemini.models.generate_content.call_count, 2)
        # user 메시지 + assistant 메시지 각 1건씩 저장
        self.assertEqual(mock_log_objects.create.call_count, 2)
        roles = [
            call.kwargs["role"]
            for call in mock_log_objects.create.call_args_list
        ]
        self.assertIn("user", roles)
        self.assertIn("assistant", roles)

    @patch("chat.pipeline.ConversationLog.objects")
    @patch("chat.pipeline.get_embedding")
    @patch("chat.pipeline.BookContentChunk.objects")
    @patch("chat.pipeline.Persona.objects")
    @patch("chat.pipeline.ForbiddenRule.objects")
    @patch("chat.pipeline._gemini_client")
    def test_story_path_calls_rag(
        self,
        mock_client,
        mock_forbidden_objects,
        mock_persona_objects,
        mock_chunk_objects,
        mock_embedding,
        mock_log_objects,
    ):
        from characters.models import Persona as _Persona

        mock_persona_objects.select_related.return_value.get.side_effect = (
            _Persona.DoesNotExist
        )
        mock_forbidden_objects.filter.return_value = []
        mock_embedding.return_value = [0.0] * 1024
        _setup_log_mock(mock_log_objects)

        # BookContentChunk queryset mock
        mock_chunk = MagicMock()
        mock_chunk.content = "길동이 산에서 호랑이를 만났다."
        mock_qs = MagicMock()
        mock_qs.__iter__ = MagicMock(return_value=iter([mock_chunk]))
        mock_chunk_objects.filter.return_value.annotate.return_value.order_by.return_value.__getitem__.return_value = mock_qs

        gemini = mock_client.return_value
        gemini.models.generate_content.side_effect = [
            MagicMock(text='{"category": "story"}'),
            MagicMock(text="길동이는 호랑이를 만나 용감하게 맞섰어요."),
        ]

        result = run_chat(
            user_id="",
            character_id=self.character.id,
            user_message="길동이가 호랑이를 만난 장면 알려줘",
        )

        self.assertEqual(result["category"], "story")
        mock_embedding.assert_called_once()

    @patch("chat.pipeline.ConversationLog.objects")
    @patch("chat.pipeline.Persona.objects")
    @patch("chat.pipeline.ForbiddenRule.objects")
    @patch("chat.pipeline._gemini_client")
    def test_forbidden_path_no_second_llm_call(
        self, mock_client, mock_forbidden_objects, mock_persona_objects, mock_log_objects
    ):
        from characters.models import Persona as _Persona

        mock_persona_objects.select_related.return_value.get.side_effect = (
            _Persona.DoesNotExist
        )
        mock_forbidden_objects.filter.return_value = []
        _setup_log_mock(mock_log_objects)

        gemini = mock_client.return_value
        gemini.models.generate_content.side_effect = [
            MagicMock(text='{"category": "forbidden"}'),
        ]

        result = run_chat(
            user_id="",
            character_id=self.character.id,
            user_message="폭력적인 내용 알려줘",
        )

        self.assertEqual(result["category"], "forbidden")
        self.assertEqual(result["response"], _DEFAULT_FALLBACK)
        # classify 1회만 호출, generate 호출 없음
        self.assertEqual(gemini.models.generate_content.call_count, 1)

        # assistant 저장 시 is_flagged=True 확인
        assistant_call = next(
            c for c in mock_log_objects.create.call_args_list
            if c.kwargs.get("role") == "assistant"
        )
        self.assertTrue(assistant_call.kwargs["is_flagged"])

    @patch("chat.pipeline.ConversationLog.objects")
    @patch("chat.pipeline.Persona.objects")
    @patch("chat.pipeline.ForbiddenRule.objects")
    @patch("chat.pipeline._gemini_client")
    def test_output_filter_replaces_flagged_response(
        self, mock_client, mock_forbidden_objects, mock_persona_objects, mock_log_objects
    ):
        from characters.models import Persona as _Persona

        mock_persona_objects.select_related.return_value.get.side_effect = (
            _Persona.DoesNotExist
        )
        _setup_log_mock(mock_log_objects)
        mock_rule = MagicMock()
        mock_rule.pattern = "나쁜말"
        mock_rule.rule_type = ForbiddenRule.RULE_TYPE_WORD
        mock_rule.severity = "block"
        mock_rule.target = "bot_output"
        mock_forbidden_objects.filter.return_value = [mock_rule]

        gemini = mock_client.return_value
        gemini.models.generate_content.side_effect = [
            MagicMock(text='{"category": "counseling"}'),
            MagicMock(text="여기 나쁜말이 들어있어요."),
        ]

        result = run_chat(
            user_id="",
            character_id=self.character.id,
            user_message="뭔가 말해줘",
        )

        self.assertEqual(result["response"], _DEFAULT_FALLBACK)
        assistant_call = next(
            c for c in mock_log_objects.create.call_args_list
            if c.kwargs.get("role") == "assistant"
        )
        self.assertTrue(assistant_call.kwargs["is_flagged"])

    @patch("chat.pipeline.ConversationLog.objects")
    @patch("chat.pipeline.Persona.objects")
    @patch("chat.pipeline.ForbiddenRule.objects")
    @patch("chat.pipeline._gemini_client")
    def test_history_passed_to_llm(
        self, mock_client, mock_forbidden_objects, mock_persona_objects, mock_log_objects
    ):
        """ConversationLog 히스토리 2개 → generate_content에 Content 3개 전달."""
        from characters.models import Persona as _Persona

        mock_persona_objects.select_related.return_value.get.side_effect = (
            _Persona.DoesNotExist
        )
        mock_forbidden_objects.filter.return_value = []

        # 이전 대화 2개 (user + assistant)
        prev_user = MagicMock()
        prev_user.role = "user"
        prev_user.message = "처음엔 어떤 이야기를 했어?"
        prev_asst = MagicMock()
        prev_asst.role = "assistant"
        prev_asst.message = "저는 홍길동이에요!"
        mock_log_objects.filter.return_value.order_by.return_value.__getitem__ = MagicMock(
            return_value=[prev_asst, prev_user]  # DESC 정렬 상태 (reversed 처리됨)
        )
        mock_log_objects.filter.return_value.filter.return_value.order_by.return_value.__getitem__ = MagicMock(
            return_value=[]
        )

        gemini = mock_client.return_value
        gemini.models.generate_content.side_effect = [
            MagicMock(text='{"category": "counseling"}'),
            MagicMock(text="그래요, 저는 홍길동이에요!"),
        ]

        run_chat(
            user_id="",
            character_id=self.character.id,
            user_message="자기소개 다시 해줘",
        )

        # generate_response_node의 generate_content 호출 (2번째 호출)
        generate_call = gemini.models.generate_content.call_args_list[1]
        contents = generate_call.kwargs.get("contents") or generate_call.args[0] if generate_call.args else generate_call.kwargs["contents"]
        # history 2개 + current 1개 = 3개
        self.assertEqual(len(contents), 3)


# ─── 5. API 엔드포인트 테스트 ─────────────────────────────────────────────────

class ChatAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        book = Book.objects.create(
            title="테스트 책", author="작가", publisher="출판사"
        )
        self.character = Character.objects.create(book=book, name="테스트 캐릭터")

    def test_missing_character_id_returns_400(self):
        resp = self.client.post(
            "/api/chat/", {"message": "안녕"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)

    def test_missing_message_returns_400(self):
        resp = self.client.post(
            "/api/chat/", {"character_id": self.character.id}, format="json"
        )
        self.assertEqual(resp.status_code, 400)

    @patch("chat.pipeline.ConversationLog.objects")
    @patch("chat.pipeline.Persona.objects")
    @patch("chat.pipeline.ForbiddenRule.objects")
    @patch("chat.pipeline._gemini_client")
    def test_success_returns_response_and_category(
        self, mock_client, mock_forbidden_objects, mock_persona_objects, mock_log_objects
    ):
        from characters.models import Persona as _Persona

        mock_persona_objects.select_related.return_value.get.side_effect = (
            _Persona.DoesNotExist
        )
        mock_forbidden_objects.filter.return_value = []
        _setup_log_mock(mock_log_objects)

        gemini = mock_client.return_value
        gemini.models.generate_content.side_effect = [
            MagicMock(text='{"category": "counseling"}'),
            MagicMock(text="반갑습니다!"),
        ]

        resp = self.client.post(
            "/api/chat/",
            {"character_id": self.character.id, "message": "안녕"},
            format="json",
        )

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("response", data)
        self.assertIn("category", data)
        self.assertEqual(data["category"], "counseling")


# ─── 6. 인사말 API 테스트 ─────────────────────────────────────────────────────

class GreetingAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.book = Book.objects.create(
            title="홍길동전", author="허균", publisher="민음사"
        )
        self.character = Character.objects.create(
            book=self.book, name="홍길동", role="주인공", emoji="🗡️"
        )

    def test_missing_character_id_returns_400(self):
        resp = self.client.get("/api/chat/greeting/")
        self.assertEqual(resp.status_code, 400)

    def test_invalid_character_id_returns_404(self):
        resp = self.client.get("/api/chat/greeting/?character_id=99999")
        self.assertEqual(resp.status_code, 404)

    def test_returns_default_greeting_when_no_persona(self):
        """Persona 없을 때 이름 기반 기본 인사말 반환."""
        resp = self.client.get(f"/api/chat/greeting/?character_id={self.character.id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("홍길동", data["greeting"])
        self.assertEqual(data["character_name"], "홍길동")
        self.assertEqual(data["character_emoji"], "🗡️")
        self.assertFalse(data["has_history"])

    @patch("chat.views.Persona.objects")
    def test_returns_persona_greeting_when_exists(self, mock_persona_objects):
        """Persona.greeting_open이 있으면 해당 인사말 반환."""
        mock_persona = MagicMock()
        mock_persona.greeting_open = "오, 반갑구나! 나는 홍길동이라 하오."
        mock_persona_objects.get.return_value = mock_persona

        resp = self.client.get(f"/api/chat/greeting/?character_id={self.character.id}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["greeting"], "오, 반갑구나! 나는 홍길동이라 하오.")

    def test_has_history_false_without_user_id(self):
        resp = self.client.get(f"/api/chat/greeting/?character_id={self.character.id}")
        self.assertFalse(resp.json()["has_history"])

    @patch("chat.views.ConversationLog.objects")
    def test_has_history_true_when_logs_exist(self, mock_log_objects):
        """해당 character + user_id의 로그가 있으면 has_history=True."""
        mock_log_objects.filter.return_value.exists.return_value = True

        user_uuid = "550e8400-e29b-41d4-a716-446655440000"
        resp = self.client.get(
            f"/api/chat/greeting/?character_id={self.character.id}&user_id={user_uuid}"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["has_history"])

    @patch("chat.views.ConversationLog.objects")
    def test_has_history_false_when_no_logs(self, mock_log_objects):
        """로그가 없으면 has_history=False."""
        mock_log_objects.filter.return_value.exists.return_value = False

        user_uuid = "550e8400-e29b-41d4-a716-446655440000"
        resp = self.client.get(
            f"/api/chat/greeting/?character_id={self.character.id}&user_id={user_uuid}"
        )
        self.assertFalse(resp.json()["has_history"])
