"""Unit tests for characters and personas apps.

CharacterGenerateView / PersonaGenerateView 는 실제 뷰 파라미터 기준으로 작성:
  - CharacterGenerateView: book_title + character_name (book_id 아님)
  - PersonaGenerateView:   book_title + character_name (character_id 아님)

Persona 모델은 managed=False — 테스트 DB에 persona 테이블이 존재해야 합니다.
(기존 test_api.py 에서 Persona.objects.create 를 이미 사용 중이므로 동일하게 동작합니다.)

Run:
    cd backend
    pytest characters/tests.py -v
"""

import json
from unittest.mock import MagicMock, patch

from rest_framework import status
from rest_framework.test import APITestCase

from books.models import Book, BookContent
from characters.models import Character, Persona


def _mock_genai_result(text: str) -> MagicMock:
    result = MagicMock()
    result.text = text
    return result


# ---------------------------------------------------------------------------
# CharacterGenerateView  POST /api/admin/characters/generate
# ---------------------------------------------------------------------------

class CharacterGenerateViewTests(APITestCase):
    """Gemini 캐릭터 자동완성 뷰 단위 테스트.

    뷰는 book_title + character_name 을 받아 Gemini 텍스트 생성 후
    _generate_and_upload_image 로 이미지를 생성·업로드합니다.
    이미지 업로드 함수는 별도로 모킹합니다.
    """

    URL = "/api/admin/characters/generate"

    def setUp(self):
        self.book = Book.objects.create(
            title="어린왕자",
            author="앙투안 드 생텍쥐페리",
            publisher="갈리마르",
            description="사막에 불시착한 조종사가 만난 어린왕자 이야기.",
        )
        BookContent.objects.create(
            book=self.book,
            content="옛날 옛날에 아주 먼 별에 어린왕자가 살았습니다.",
            embed_status="completed",
        )

    # 데코레이터 적용 순서: 안쪽(아래)부터 첫 번째 파라미터로 전달됨
    @patch("characters.views._generate_and_upload_image", return_value="https://fake.storage/image.jpg")
    @patch("characters.views.genai.Client")
    def test_generate_found_true_for_matching_character(self, mock_client_cls, _mock_upload):
        mock_client_cls.return_value.models.generate_content.return_value = _mock_genai_result(
            json.dumps({
                "name": "어린왕자",
                "role": "주인공",
                "gender": "남성",
                "emoji": "🧒",
                "description": "금발에 초록 망토를 두른 작은 왕자.",
            })
        )

        with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake-key"}):
            response = self.client.post(
                self.URL,
                {"book_title": "어린왕자", "character_name": "어린왕자"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for field in ("role", "gender", "emoji", "description"):
            self.assertIn(field, response.data)
            self.assertTrue(response.data[field], f"'{field}' 필드가 비어 있습니다.")
        self.assertIn("profile_image_url", response.data)
        self.assertTrue(response.data["profile_image_url"])

    @patch("characters.views.genai.Client")
    def test_generate_found_false_for_unrelated_character(self, mock_client_cls):
        """Gemini 가 등장인물 아님을 응답하면 422 반환, DB에 캐릭터 미생성."""
        mock_client_cls.return_value.models.generate_content.return_value = _mock_genai_result(
            json.dumps({"error": "해당 캐릭터는 이 동화책의 등장인물이 아닙니다."})
        )

        with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake-key"}):
            response = self.client.post(
                self.URL,
                {"book_title": "어린왕자", "character_name": "아이언맨"},
                format="json",
            )

        self.assertEqual(response.status_code, 422)
        self.assertIn("error", response.data)
        self.assertFalse(Character.objects.filter(name="아이언맨").exists())

    def test_generate_missing_book_title_returns_400(self):
        """book_title 없이 호출하면 400."""
        with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake-key"}):
            response = self.client.post(
                self.URL,
                {"character_name": "어린왕자"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_generate_missing_character_name_returns_400(self):
        """character_name 없이 호출하면 400."""
        with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake-key"}):
            response = self.client.post(
                self.URL,
                {"book_title": "어린왕자"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_generate_missing_api_key_returns_503(self):
        with patch.dict("os.environ", {"GOOGLE_API_KEY": ""}):
            response = self.client.post(
                self.URL,
                {"book_title": "어린왕자", "character_name": "어린왕자"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


# ---------------------------------------------------------------------------
# CharacterAdminViewSet  GET/POST /api/admin/characters
# ---------------------------------------------------------------------------

class CharacterAdminViewSetTests(APITestCase):
    LIST_URL = "/api/admin/characters"

    def setUp(self):
        self.book = Book.objects.create(
            title="어린왕자",
            author="앙투안 드 생텍쥐페리",
            publisher="갈리마르",
            description="어린왕자 이야기.",
        )

    def test_create_character_with_book_id(self):
        response = self.client.post(
            self.LIST_URL,
            {
                "book_id": self.book.id,
                "name": "어린왕자",
                "role": "주인공",
                "gender": "남성",
                "emoji": "🧒",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["book_id"], self.book.id)
        character = Character.objects.get(id=response.data["id"])
        self.assertEqual(character.book_id, self.book.id)

    def test_list_characters_filtered_by_book(self):
        other_book = Book.objects.create(
            title="헨젤과 그레텔",
            author="그림형제",
            publisher="테스트출판사",
            description="과자집 이야기.",
        )
        Character.objects.create(book=self.book, name="어린왕자")
        Character.objects.create(book=other_book, name="헨젤")

        response = self.client.get(self.LIST_URL, {"book_id": self.book.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "어린왕자")


# ---------------------------------------------------------------------------
# PersonaGenerateView  POST /api/admin/personas/generate
# (personas 앱은 characters 앱 내부에 구현되어 있음)
# ---------------------------------------------------------------------------

class PersonaGenerateViewTests(APITestCase):
    """Gemini 페르소나 자동완성 뷰 단위 테스트.

    뷰는 book_title + character_name (+ 선택: character_role, character_description) 을 받고
    항상 approved_status="draft" 를 반환합니다.
    """

    URL = "/api/admin/personas/generate"

    def _post(self, data: dict | None = None, api_key: str = "fake-key"):
        payload: dict = {
            "book_title": "어린왕자",
            "character_name": "어린왕자",
            "character_role": "주인공",
            "character_description": "금발에 초록 망토를 두른 작은 왕자.",
        }
        if data:
            payload.update(data)
        with patch.dict("os.environ", {"GOOGLE_API_KEY": api_key}):
            return self.client.post(self.URL, payload, format="json")

    @patch("characters.views.genai.Client")
    def test_generate_returns_required_fields(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = _mock_genai_result(
            json.dumps({
                "greeting_open": "안녕, 나는 어린왕자야!",
                "greeting_close": "잘 있어!",
                "personality": "호기심이 많고 순수한 성격.",
                "speech_style": "짧고 직접적인 말투.",
                "catchphrase": "어른들은 참 이상해.",
                "bio": "소행성 B-612 출신의 작은 왕자.",
                "tags": ["순수", "호기심", "우정"],
                "opening_scene": "사막 한가운데 홀로 서 있다.",
                "era": "현대",
                "background": "사막",
                "user_role": "조종사",
                "user_relationship": "친구",
                "system_prompt": "You are 어린왕자, a curious and pure-hearted prince.",
                "approved_status": "draft",
            })
        )

        response = self._post()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for field in ("personality", "speech_style", "system_prompt"):
            self.assertIn(field, response.data)
            self.assertTrue(response.data[field], f"'{field}' 필드가 비어 있습니다.")
        # 자동완성 결과는 항상 draft 상태여야 함 (편향 방지)
        self.assertEqual(response.data["approved_status"], "draft")

    def test_generate_missing_book_title_returns_400(self):
        """book_title 없이 호출하면 400."""
        with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake-key"}):
            response = self.client.post(
                self.URL,
                {"character_name": "어린왕자"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_generate_missing_character_name_returns_400(self):
        """character_name 없이 호출하면 400."""
        with patch.dict("os.environ", {"GOOGLE_API_KEY": "fake-key"}):
            response = self.client.post(
                self.URL,
                {"book_title": "어린왕자"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("characters.views.genai.Client")
    def test_generate_invalid_json_returns_500(self, mock_client_cls):
        mock_client_cls.return_value.models.generate_content.return_value = _mock_genai_result(
            "이것은 JSON이 아닙니다"
        )

        response = self._post()

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)

    def test_generate_missing_api_key_returns_503(self):
        response = self._post(api_key="")

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


# ---------------------------------------------------------------------------
# PersonaAdminViewSet  GET/POST/PATCH /api/admin/personas
# NOTE: Persona.managed=False — 테스트 DB에 persona 테이블이 필요합니다.
# ---------------------------------------------------------------------------

class PersonaAdminViewSetTests(APITestCase):
    LIST_URL = "/api/admin/personas"

    def setUp(self):
        self.book = Book.objects.create(
            title="어린왕자",
            author="앙투안 드 생텍쥐페리",
            publisher="갈리마르",
            description="어린왕자 이야기.",
        )
        self.character = Character.objects.create(
            book=self.book,
            name="어린왕자",
            role="주인공",
        )

    def _payload(self, **overrides) -> dict:
        data: dict = {
            "character_id": self.character.id,
            "book_id": self.book.id,
            "greeting_open": "안녕!",
            "personality": "순수하고 호기심 많음.",
            "system_prompt": "You are 어린왕자.",
        }
        data.update(overrides)
        return data

    def test_create_persona_default_approval_status_is_draft(self):
        """approved_status 를 명시하지 않으면 기본값 'draft' 여야 한다.

        편향 방지: 자동완성으로 생성된 페르소나는 항상 관리자 검토 대기(draft) 상태로 시작해야 함.
        Persona.approved_status 필드의 default='draft' 설정이 동작하는지 검증한다.
        """
        response = self.client.post(self.LIST_URL, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["approved_status"], "draft")
        persona = Persona.objects.get(id=response.data["id"])
        self.assertEqual(persona.approved_status, "draft")

    def test_update_persona_approval_status_to_approved(self):
        """관리자가 PATCH 로 approved_status 를 'approved' 로 변경할 수 있어야 한다."""
        persona = Persona.objects.create(
            character=self.character,
            book=self.book,
            approved_status="draft",
        )

        response = self.client.patch(
            f"{self.LIST_URL}/{persona.id}",
            {"approved_status": "approved"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["approved_status"], "approved")
        persona.refresh_from_db()
        self.assertEqual(persona.approved_status, "approved")
