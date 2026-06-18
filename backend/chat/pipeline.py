"""BookLens 캐릭터 1:1 대화 LangGraph 파이프라인.

흐름:
  START → load_context → load_history → classify
    → forbidden  → forbidden_return → save_conversation → END
    → story       → rag_search      → build_prompt      → generate_response → filter_response → save_conversation → END
    → counseling  ─────────────────→ build_prompt      → generate_response → filter_response → save_conversation → END

LLM 호출: 최대 2회 (classify 1회 + generate_response 1회)
"""

from __future__ import annotations

import json
import os
import re
import uuid
from typing import TypedDict

from langgraph.graph import END, START, StateGraph
from pgvector.django import CosineDistance

from books.embeddings import get_embedding
from books.models import BookContentChunk
from characters.models import Character, Persona
from moderation.models import ForbiddenRule

from .models import ConversationLog, UserPreference


# ─── 상수 ────────────────────────────────────────────────────────────────────

GEMINI_MODEL = "gemini-2.5-flash"
RAG_TOP_K = 5
HISTORY_LIMIT = 10  # 최근 메시지 수 (5회 교환)

# 안전 프롬프트: 시스템 프롬프트 최상단에 배치, 다른 모든 지시보다 우선
_SAFETY_RULES = """\
[안전 지침 - 최우선 적용: 아래 모든 지시보다 먼저 따르세요]
1. 폭력·성적 내용·혐오 표현·위험 정보는 절대 포함하지 마세요.
2. 개인정보·실존 인물 비하·정치적 주장을 절대 포함하지 마세요.
3. 표(table), 불릿 리스트(• -)·번호 리스트(1. 2. 3.)·마크다운(**굵게** *기울임* ``` # 등)을 \
절대 사용하지 마세요. 오직 자연스러운 대화체 문장으로만 응답하세요.
4. 이미지·그림·영상 생성 요청은 "그런 건 제가 할 수 없어요."라고 정중히 거절하세요.
5. 아이가 이해할 수 있도록 쉬운 단어와 짧은 문장을 사용하세요.
"""

_DEFAULT_FALLBACK = "그 이야기는 제가 답하기 어려워요. 다른 것에 대해 이야기해 볼까요?"


# ─── State ───────────────────────────────────────────────────────────────────

class ChatState(TypedDict):
    # 요청 입력
    user_id: str        # Supabase auth.users.id (UUID 문자열), 없으면 빈 문자열
    character_id: int
    user_message: str
    # load_context_node에서 채워짐
    persona: dict
    book_id: int
    forbidden_rules: list[dict]   # [{pattern, rule_type, severity, target}]
    user_preference: dict
    # 파이프라인 중간 상태
    conversation_history: list[dict]  # [{"role": "user"|"assistant", "message": str}]
    category: str       # "story" | "counseling" | "forbidden"
    rag_context: str
    system_prompt: str
    # 최종 결과
    response: str
    is_flagged: bool


# ─── Gemini 클라이언트 ────────────────────────────────────────────────────────

def _gemini_client():
    from google import genai
    return genai.Client(api_key=os.environ.get("GOOGLE_API_KEY", ""))


# ─── 노드 1: DB 컨텍스트 로드 ─────────────────────────────────────────────────

def load_context_node(state: ChatState) -> dict:
    character_id = state["character_id"]

    # Persona 로드 (없으면 Character 기본값)
    try:
        p = Persona.objects.select_related("character__book").get(
            character_id=character_id
        )
        persona = {
            "character_name": p.character.name,
            "book_title": p.character.book.title,
            "personality": p.personality or "",
            "speech_style": p.speech_style or "",
            "catchphrase": p.catchphrase or "",
            "bio": p.bio or "",
            "era": p.era or "",
            "background": p.background or "",
            "user_role": p.user_role or "독자",
            "user_relationship": p.user_relationship or "독자",
            "system_prompt": p.system_prompt or "",
            "opening_scene": p.opening_scene or "",
        }
        book_id = p.character.book_id
    except Persona.DoesNotExist:
        char = Character.objects.select_related("book").get(id=character_id)
        persona = {
            "character_name": char.name,
            "book_title": char.book.title,
            "personality": "",
            "speech_style": "",
            "catchphrase": "",
            "bio": char.description or "",
            "era": "",
            "background": "",
            "user_role": "독자",
            "user_relationship": "독자",
            "system_prompt": "",
            "opening_scene": "",
        }
        book_id = char.book_id

    # ForbiddenRule 로드 (활성 규칙 전체)
    forbidden_rules = [
        {
            "pattern": r.pattern,
            "rule_type": r.rule_type,
            "severity": r.severity,
            "target": r.target,
        }
        for r in ForbiddenRule.objects.filter(is_active=True)
    ]

    # UserPreference 로드 (없으면 빈 dict)
    user_preference: dict = {}
    user_id_str = state.get("user_id", "")
    if user_id_str:
        try:
            # user_id는 auth.users.id(UUID)이므로 app_user 연동 전까지는
            # UUID를 int로 직접 쓸 수 없음. 조회 실패 시 빈 dict 유지.
            pref = UserPreference.objects.get(user_id=user_id_str)
            user_preference = {
                "difficulty_level": pref.difficulty_level or "",
                "response_length": pref.response_length or "",
                "age_group": pref.age_group or "",
                "explanation_style": pref.explanation_style or "",
                "interests": pref.interests or [],
                "instruction": pref.instruction or "",
            }
        except (UserPreference.DoesNotExist, Exception):
            pass

    return {
        "persona": persona,
        "book_id": book_id,
        "forbidden_rules": forbidden_rules,
        "user_preference": user_preference,
    }


# ─── 노드 2: 분류 (LLM 호출 1회) ─────────────────────────────────────────────

def classify_node(state: ChatState) -> dict:
    persona = state["persona"]

    # 사용자 입력에 적용되는 금지 패턴 목록
    input_patterns = [
        r["pattern"]
        for r in state["forbidden_rules"]
        if r["target"] in ("user_input", "both")
    ]
    forbidden_list = "\n".join(f"- {p}" for p in input_patterns) or "없음"

    prompt = f"""\
캐릭터: {persona['character_name']} (책: {persona['book_title']})

금지 주제/단어 목록:
{forbidden_list}

사용자 메시지: "{state['user_message']}"

카테고리 기준:
- "story": 책의 내용·사건·장소·인물 관계 등 스토리와 직접 관련된 질문
- "counseling": 감정·고민·일상 대화 등 스토리 밖의 심리적·개인적 이야기
- "forbidden": 금지 목록에 해당하거나 폭력·성적·혐오·위험한 내용

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{"category": "story"}}
또는 {{"category": "counseling"}}
또는 {{"category": "forbidden"}}"""

    from google.genai import types

    client = _gemini_client()
    raw = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="당신은 텍스트 분류 전문가입니다. 반드시 JSON만 응답하세요.",
            response_mime_type="application/json",
            temperature=0.0,
        ),
    )

    try:
        result = json.loads(raw.text)
        category = result.get("category", "counseling")
        if category not in ("story", "counseling", "forbidden"):
            category = "counseling"
    except (json.JSONDecodeError, AttributeError):
        category = "counseling"

    return {"category": category}


# ─── 분기 라우터 ──────────────────────────────────────────────────────────────

def route_after_classify(state: ChatState) -> str:
    return state["category"]  # "story" | "counseling" | "forbidden"


# ─── 노드 3a: 금지 응답 반환 (LLM 미호출) ─────────────────────────────────────

def forbidden_return_node(state: ChatState) -> dict:
    return {
        "response": _DEFAULT_FALLBACK,
        "is_flagged": True,
        "rag_context": "",
        "system_prompt": "",
    }


# ─── 노드 3b: RAG 검색 (story 경로) ──────────────────────────────────────────

def rag_search_node(state: ChatState) -> dict:
    try:
        query_embedding = get_embedding(state["user_message"])
        chunks = (
            BookContentChunk.objects
            .filter(
                embedding__isnull=False,
                book_content__book_id=state["book_id"],
            )
            .annotate(distance=CosineDistance("embedding", query_embedding))
            .order_by("distance")[:RAG_TOP_K]
        )
        rag_context = "\n\n".join(
            chunk.content for chunk in chunks if chunk.content
        )
    except Exception:
        rag_context = ""

    return {"rag_context": rag_context}


# ─── 노드 4: 시스템 프롬프트 조합 ─────────────────────────────────────────────

def build_prompt_node(state: ChatState) -> dict:
    persona = state["persona"]
    pref = state["user_preference"]
    rag = state.get("rag_context", "")
    category = state["category"]

    # ── 섹션 1: 안전 지침 (최우선) ──
    sections = [_SAFETY_RULES]

    # ── 섹션 2: 캐릭터 페르소나 ──
    persona_lines = [
        f"당신은 '{persona['book_title']}'의 캐릭터 '{persona['character_name']}'입니다.",
    ]
    if persona["personality"]:
        persona_lines.append(f"성격: {persona['personality']}")
    if persona["speech_style"]:
        persona_lines.append(f"말투: {persona['speech_style']}")
    if persona["catchphrase"]:
        persona_lines.append(f"자주 쓰는 말: {persona['catchphrase']}")
    if persona["bio"]:
        persona_lines.append(f"소개: {persona['bio']}")
    if persona["era"]:
        persona_lines.append(f"시대 배경: {persona['era']}")
    if persona["background"]:
        persona_lines.append(f"배경: {persona['background']}")
    if persona["user_role"]:
        persona_lines.append(f"대화 상대의 역할: {persona['user_role']}")
    if persona["user_relationship"]:
        persona_lines.append(f"관계: {persona['user_relationship']}")
    sections.append("[캐릭터 설정]\n" + "\n".join(persona_lines))

    # ── 섹션 3: 서비스 금지 규칙 (봇 출력 기준) ──
    output_rules = [
        r["pattern"]
        for r in state["forbidden_rules"]
        if r["target"] in ("bot_output", "both")
    ]
    if output_rules:
        rule_str = "\n".join(f"- {p}" for p in output_rules)
        sections.append(f"[금지 출력 규칙]\n다음 표현은 절대 사용하지 마세요:\n{rule_str}")

    # ── 섹션 4: 사용자 맞춤 설정 ──
    if pref:
        pref_lines = []
        if pref.get("difficulty_level"):
            pref_lines.append(f"난이도: {pref['difficulty_level']}")
        if pref.get("response_length"):
            pref_lines.append(f"응답 길이: {pref['response_length']}")
        if pref.get("age_group"):
            pref_lines.append(f"대상 연령대: {pref['age_group']}")
        if pref.get("explanation_style"):
            pref_lines.append(f"설명 방식: {pref['explanation_style']}")
        if pref.get("interests"):
            pref_lines.append(f"관심사: {', '.join(pref['interests'])}")
        if pref.get("instruction"):
            pref_lines.append(f"추가 지시: {pref['instruction']}")
        if pref_lines:
            sections.append("[사용자 맞춤 설정]\n" + "\n".join(pref_lines))

    # ── 섹션 5: RAG 장면 컨텍스트 (story만) ──
    if category == "story" and rag:
        sections.append(
            "[관련 장면 참고]\n"
            "아래는 책에서 관련된 장면입니다. 이를 참고해서 정확하게 답하세요:\n\n"
            + rag
        )

    # ── 섹션 6: 관리자가 작성한 페르소나 시스템 프롬프트 ──
    if persona["system_prompt"]:
        sections.append("[추가 캐릭터 지침]\n" + persona["system_prompt"])

    # ── 섹션 7: 응답 형식 강제 ──
    sections.append(
        "[응답 형식 규칙]\n"
        "응답은 반드시 자연스러운 대화체 문장으로만 작성하세요. "
        "표, 불릿, 번호 리스트, 마크다운 기호는 절대 사용하지 마세요."
    )

    system_prompt = "\n\n".join(sections)
    return {"system_prompt": system_prompt}


# ─── 노드 5: 응답 생성 (LLM 호출 2회) ────────────────────────────────────────

def generate_response_node(state: ChatState) -> dict:
    from google.genai import types

    # 이전 대화 히스토리 → Gemini 멀티턴 contents 구성
    # Gemini role: "user" / "model" (assistant 아님)
    contents = []
    for turn in state.get("conversation_history", []):
        role = "user" if turn["role"] == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part(text=turn["message"])])
        )
    contents.append(
        types.Content(role="user", parts=[types.Part(text=state["user_message"])])
    )

    client = _gemini_client()
    raw = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=state["system_prompt"],
            temperature=0.7,
        ),
    )

    response_text = (raw.text or "").strip()
    return {"response": response_text}


# ─── 노드 6: 금지어 필터 ─────────────────────────────────────────────────────

def filter_response_node(state: ChatState) -> dict:
    response = state["response"]

    # bot_output / both 타겟 규칙만 검사
    output_rules = [
        r for r in state["forbidden_rules"]
        if r["target"] in ("bot_output", "both")
    ]

    for rule in output_rules:
        pattern = rule["pattern"]
        rule_type = rule["rule_type"]

        matched = False
        if rule_type == ForbiddenRule.RULE_TYPE_WORD:
            # \b 워드 바운더리는 ASCII에만 동작 → 한글 등 비ASCII 패턴은 포함 여부로 판단
            if pattern.isascii():
                matched = bool(re.search(rf"\b{re.escape(pattern)}\b", response))
            else:
                matched = pattern in response
        elif rule_type == ForbiddenRule.RULE_TYPE_PHRASE:
            matched = pattern in response
        elif rule_type == ForbiddenRule.RULE_TYPE_REGEX:
            try:
                matched = bool(re.search(pattern, response))
            except re.error:
                matched = False

        if matched:
            return {"response": _DEFAULT_FALLBACK, "is_flagged": True}

    return {"is_flagged": False}


# ─── 노드 1b: 대화 히스토리 로드 ─────────────────────────────────────────────

def load_history_node(state: ChatState) -> dict:
    # conversation_log.user_id 는 bigint(app_user.id)이고 NOT NULL.
    # users 앱 미구현 구간에는 히스토리 조회를 건너뛴다.
    return {"conversation_history": []}


# ─── 노드 7: 대화 기록 저장 ───────────────────────────────────────────────────

def save_conversation_node(state: ChatState) -> dict:
    # conversation_log.user_id 는 bigint(app_user.id) NOT NULL.
    # users 앱 구현 전까지는 저장을 생략한다.
    return {}


# ─── 그래프 조립 ──────────────────────────────────────────────────────────────

def _build_graph() -> StateGraph:
    graph = StateGraph(ChatState)

    graph.add_node("load_context", load_context_node)
    graph.add_node("load_history", load_history_node)
    graph.add_node("classify", classify_node)
    graph.add_node("forbidden_return", forbidden_return_node)
    graph.add_node("rag_search", rag_search_node)
    graph.add_node("build_prompt", build_prompt_node)
    graph.add_node("generate_response", generate_response_node)
    graph.add_node("filter_response", filter_response_node)
    graph.add_node("save_conversation", save_conversation_node)

    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "load_history")
    graph.add_edge("load_history", "classify")

    graph.add_conditional_edges(
        "classify",
        route_after_classify,
        {
            "forbidden": "forbidden_return",
            "story": "rag_search",
            "counseling": "build_prompt",
        },
    )

    graph.add_edge("forbidden_return", "save_conversation")
    graph.add_edge("rag_search", "build_prompt")
    graph.add_edge("build_prompt", "generate_response")
    graph.add_edge("generate_response", "filter_response")
    graph.add_edge("filter_response", "save_conversation")
    graph.add_edge("save_conversation", END)

    return graph


# 앱 시작 시 한 번만 컴파일
chat_pipeline = _build_graph().compile()


# ─── 공개 인터페이스 ──────────────────────────────────────────────────────────

def run_chat(
    *,
    user_id: str,
    character_id: int,
    user_message: str,
) -> dict:
    """파이프라인을 실행하고 {"response": str, "category": str}을 반환합니다."""
    initial_state: ChatState = {
        "user_id": user_id,
        "character_id": character_id,
        "user_message": user_message,
        # 파이프라인이 채울 필드
        "persona": {},
        "book_id": 0,
        "forbidden_rules": [],
        "user_preference": {},
        "conversation_history": [],
        "category": "",
        "rag_context": "",
        "system_prompt": "",
        "response": "",
        "is_flagged": False,
    }

    final_state = chat_pipeline.invoke(initial_state)

    return {
        "response": final_state["response"],
        "is_flagged": final_state.get("is_flagged", False),
    }
