"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  adminDashboardApi,
  type AdminDashboardResponse,
} from "@/lib/api";

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-[#eadcf0] bg-white p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)] ${className}`}
    >
      {children}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#eadcf0] bg-[#fff9fc] px-4 py-8 text-center text-[12px] text-[#94859d]">
      {label}
    </div>
  );
}

function CharacterAvatar({
  emoji,
  imageUrl,
  fallback,
}: {
  emoji: string | null;
  imageUrl: string | null;
  fallback: string;
}) {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[18px] border border-[#eadcf0] bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] text-xl">
      {imageUrl ? (
        <img src={imageUrl} alt={fallback} className="h-full w-full object-cover" />
      ) : (
        emoji || fallback.slice(0, 1)
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Card>
      <span className="block text-[11px] font-bold text-[#9b74ad]">{label}</span>
      <b className="mt-2 block text-3xl tracking-tight text-[#7d5ba6]">
        {formatNumber(value)}
      </b>
      <span className="mt-1 block text-[11px] text-[#94859d]">{helper}</span>
    </Card>
  );
}

const EMPTY_DASHBOARD: AdminDashboardResponse = {
  metrics: {
    today_conversations: 0,
    active_users: 0,
    review_needed: 0,
    total_books: 0,
    total_characters: 0,
  },
  top_characters: [],
  top_books: [],
  feedback: {
    like_count: 0,
    dislike_count: 0,
    report_count: 0,
  },
  persona_status: {
    approved: 0,
    draft: 0,
    rejected: 0,
  },
  safety: {
    flagged_today: 0,
    active_rules: 0,
    reports: 0,
  },
};

export default function Page() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse>(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    adminDashboardApi
      .detail()
      .then((data) => {
        setDashboard(data);
        setErrorMessage("");
      })
      .catch(() => {
        setErrorMessage("대시보드 데이터를 불러오지 못했습니다.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const feedbackTotal = useMemo(
    () =>
      dashboard.feedback.like_count +
      dashboard.feedback.dislike_count +
      dashboard.feedback.report_count,
    [dashboard.feedback],
  );
  const likeRate = feedbackTotal
    ? Math.round((dashboard.feedback.like_count / feedbackTotal) * 100)
    : 0;

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 text-[26px] font-semibold tracking-tight text-[#7d5ba6]">
            서비스 운영 대시보드
          </h3>
          <p className="mt-2 text-[13px] leading-6 text-[#94859d]">
            운영자가 먼저 확인해야 하는 대화량, 인기 캐릭터, 인기 동화책,
            검토 필요 항목과 피드백 현황을 요약합니다.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/admin/books"
            className="rounded-full border border-[#eadcf0] bg-white px-4 py-2.5 text-[12px] font-bold text-[#8b69a3]"
          >
            동화 관리
          </Link>
          <Link
            href="/admin/test-chat"
            className="rounded-full bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] px-4 py-2.5 text-[12px] font-bold text-white"
          >
            테스트 채팅
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-[#f0c0c0] bg-[#fff7f7] px-4 py-3 text-[12px] font-semibold text-[#b04040]">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <Card>
          <p className="m-0 py-10 text-center text-[13px] text-[#94859d]">
            운영 데이터를 불러오는 중입니다.
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <MetricCard
              label="오늘 전체 대화량"
              value={dashboard.metrics.today_conversations}
              helper="사용자 메시지 기준"
            />
            <MetricCard
              label="오늘 활성 사용자"
              value={dashboard.metrics.active_users}
              helper="대화한 사용자 수"
            />
            <MetricCard
              label="검토 필요 항목"
              value={dashboard.metrics.review_needed}
              helper="신고, flagged, draft 페르소나 합산"
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="m-0 text-[15px] text-[#72508c]">
                  인기 캐릭터 TOP 5
                </h4>
                <span className="text-[11px] text-[#94859d]">전체 대화량 기준</span>
              </div>

              {dashboard.top_characters.length === 0 ? (
                <EmptyState label="아직 집계된 캐릭터 대화가 없습니다." />
              ) : (
                <div className="grid gap-2">
                  {dashboard.top_characters.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-[18px] border border-[#eadcf0] bg-[#fff9fc] p-3"
                    >
                      <CharacterAvatar
                        emoji={item.emoji}
                        imageUrl={item.profile_image_url}
                        fallback={item.name}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="text-[13px] text-[#65506e]">{item.name}</b>
                          <span className="rounded-full bg-[#f7ecfb] px-2 py-0.5 text-[10px] font-bold text-[#8d65a5]">
                            {index + 1}위
                          </span>
                        </div>
                        <p className="m-0 mt-1 truncate text-[10px] text-[#94859d]">
                          {item.book_title} · {item.role || "역할 미등록"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#f3eaff] px-3 py-1.5 text-[10px] font-bold text-[#8b67a2]">
                        {formatNumber(item.conversation_count)}회
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="m-0 text-[15px] text-[#72508c]">
                  인기 동화책 TOP 5
                </h4>
                <span className="text-[11px] text-[#94859d]">캐릭터 대화 기반</span>
              </div>

              {dashboard.top_books.length === 0 ? (
                <EmptyState label="아직 집계된 동화책 대화가 없습니다." />
              ) : (
                <div className="grid gap-2">
                  {dashboard.top_books.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-[18px] border border-[#eadcf0] bg-[#fff9fc] p-3"
                    >
                      <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-gradient-to-br from-[#ffd6ea] via-[#cdbdff] to-[#ffeabf] text-[13px] font-black text-[#7d5ba6]">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <b className="block truncate text-[13px] text-[#65506e]">
                          {item.title}
                        </b>
                        <p className="m-0 mt-1 truncate text-[10px] text-[#94859d]">
                          {item.author}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#f3eaff] px-3 py-1.5 text-[10px] font-bold text-[#8b67a2]">
                        {formatNumber(item.conversation_count)}회
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
            <Card>
              <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">
                피드백 현황
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-[#eadcf0] bg-[#fff9fc] p-3">
                  <span className="block text-[10px] font-bold text-[#9b74ad]">
                    좋아요
                  </span>
                  <b className="mt-1 block text-2xl text-[#7d5ba6]">
                    {formatNumber(dashboard.feedback.like_count)}
                  </b>
                </div>
                <div className="rounded-2xl border border-[#eadcf0] bg-[#fff9fc] p-3">
                  <span className="block text-[10px] font-bold text-[#9b74ad]">
                    싫어요
                  </span>
                  <b className="mt-1 block text-2xl text-[#7d5ba6]">
                    {formatNumber(dashboard.feedback.dislike_count)}
                  </b>
                </div>
                <div className="rounded-2xl border border-[#eadcf0] bg-[#fff9fc] p-3">
                  <span className="block text-[10px] font-bold text-[#9b74ad]">
                    신고
                  </span>
                  <b className="mt-1 block text-2xl text-[#7d5ba6]">
                    {formatNumber(dashboard.feedback.report_count)}
                  </b>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-[#eadcf0] bg-gradient-to-br from-[#fff7fb] to-[#f4efff] p-3">
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <b className="text-[#72508c]">좋아요 비율</b>
                  <span className="font-bold text-[#8b67a2]">{likeRate}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f3e8f8]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c7a8ff] to-[#f6a9d2]"
                    style={{ width: `${likeRate}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">
                페르소나와 안전 운영
              </h4>
              <div className="grid gap-2">
                <div className="rounded-2xl border border-[#eadcf0] bg-[#fff9fc] p-3 text-[12px] text-[#6f6174]">
                  <b className="mr-2 text-[#9b74ad]">검토 중</b>
                  페르소나 {formatNumber(dashboard.persona_status.draft)}건
                </div>
                <div className="rounded-2xl border border-[#eadcf0] bg-[#fff9fc] p-3 text-[12px] text-[#6f6174]">
                  <b className="mr-2 text-[#9b74ad]">승인됨</b>
                  페르소나 {formatNumber(dashboard.persona_status.approved)}건
                </div>
                <div className="rounded-2xl border border-[#eadcf0] bg-[#fff9fc] p-3 text-[12px] text-[#6f6174]">
                  <b className="mr-2 text-[#9b74ad]">안전 필터</b>
                  오늘 감지 {formatNumber(dashboard.safety.flagged_today)}건 · 활성 규칙{" "}
                  {formatNumber(dashboard.safety.active_rules)}개
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-[#eadcf0] bg-gradient-to-br from-[#fff0f7] to-[#f4efff] p-3">
                <b className="mb-1 block text-[12px] text-[#7d5ba6]">
                  전체 운영 리소스
                </b>
                <p className="m-0 text-[11px] leading-relaxed text-[#94859d]">
                  등록 동화책 {formatNumber(dashboard.metrics.total_books)}권,
                  등록 캐릭터 {formatNumber(dashboard.metrics.total_characters)}명을
                  기준으로 운영 현황을 집계합니다.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
