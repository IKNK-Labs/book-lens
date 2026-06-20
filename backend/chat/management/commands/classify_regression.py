"""classify_node 회귀 테스트 실행 커맨드.

실제 Gemini API를 호출하므로 `python manage.py test`에는 포함하지 않고
수동으로 실행한다.

사용법:
    cd backend && python manage.py classify_regression
"""

from __future__ import annotations

from django.core.management.base import BaseCommand

from chat.pipeline import classify_node
from chat.regression.classify_questions import CLASSIFY_QUESTIONS

_PERSONA = {
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
}

_FORBIDDEN_RULES = [
    {"pattern": "자살", "rule_type": "word", "severity": "block", "target": "both"},
    {"pattern": "폭력", "rule_type": "word", "severity": "block", "target": "both"},
]


def _make_state(message: str) -> dict:
    return {
        "user_id": "",
        "character_id": 1,
        "user_message": message,
        "persona": _PERSONA,
        "book_id": 1,
        "forbidden_rules": _FORBIDDEN_RULES,
        "user_preference": {},
        "conversation_history": [],
        "category": "",
        "rag_context": "",
        "system_prompt": "",
        "response": "",
        "is_flagged": False,
    }


class Command(BaseCommand):
    help = "classify_node를 실제 Gemini API로 호출해 분류 정확도 회귀 테스트를 실행한다."

    def handle(self, *args, **options):
        results = []
        for question in CLASSIFY_QUESTIONS:
            state = _make_state(question["message"])
            try:
                actual = classify_node(state)["category"]
            except Exception as exc:  # noqa: BLE001 - regression harness must not crash mid-run
                actual = f"ERROR:{exc.__class__.__name__}"
            expected = question["expected"]
            allowed = expected if isinstance(expected, list) else [expected]
            passed = actual in allowed
            results.append({**question, "actual": actual, "passed": passed})

        total = len(results)
        passed_count = sum(1 for r in results if r["passed"])

        self.stdout.write("")
        self.stdout.write("=== classify_node 회귀 테스트 결과 ===")
        for r in results:
            mark = "PASS" if r["passed"] else "FAIL"
            self.stdout.write(
                f"[{mark}] {r['id']:<10} expected={r['expected']!s:<24} "
                f"actual={r['actual']:<12} message={r['message']}"
            )

        self.stdout.write("")
        self.stdout.write("--- 카테고리별 정확도 ---")
        categories = sorted(
            {c for r in results for c in (
                r["expected"] if isinstance(r["expected"], list) else [r["expected"]]
            )}
        )
        for category in categories:
            subset = [
                r for r in results
                if category in (r["expected"] if isinstance(r["expected"], list) else [r["expected"]])
            ]
            sub_passed = sum(1 for r in subset if r["passed"])
            self.stdout.write(f"{category}: {sub_passed}/{len(subset)}")

        self.stdout.write("")
        accuracy = (passed_count / total * 100) if total else 0.0
        self.stdout.write(f"전체 정확도: {passed_count}/{total} ({accuracy:.1f}%)")

        failed = [r for r in results if not r["passed"]]
        if failed:
            self.stdout.write("")
            self.stdout.write("--- 실패 케이스 ---")
            for r in failed:
                self.stdout.write(
                    f"{r['id']}: expected={r['expected']} actual={r['actual']} "
                    f"message=\"{r['message']}\" note=\"{r['note']}\""
                )
