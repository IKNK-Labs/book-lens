"""Management command: python manage.py run_chunk_experiment

청크 사이즈 튜닝 실험을 실행하고 결과를 콘솔과 CSV 파일에 출력합니다.
실험에 사용된 임시 DB 데이터는 savepoint rollback 으로 자동 제거됩니다.

예시:
    BGE_M3_DEVICE=cpu python manage.py run_chunk_experiment
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "chunk_size × top_k 조합별 RAG 검색 정확도·속도 비교 실험. "
        "결과는 backend/experiments/chunk_tuning_result.csv 에 저장됩니다."
    )

    def handle(self, *args, **options) -> None:
        from scripts.chunk_tuning_experiment import run, print_table, save_csv

        self.stdout.write("=" * 60)
        self.stdout.write("청크 사이즈 튜닝 실험 시작")
        self.stdout.write("=" * 60 + "\n")

        rows = run(stdout=self.stdout)
        print_table(rows, stdout=self.stdout)

        csv_path = save_csv(rows)
        self.stdout.write(f"결과 저장: {csv_path}\n")
        self.stdout.write(self.style.SUCCESS("실험 완료"))
