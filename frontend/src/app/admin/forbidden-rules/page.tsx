"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  adminForbiddenRulesApi,
  type ForbiddenRulePayload,
  type ForbiddenRuleResponse,
  type ForbiddenRuleSeverity,
  type ForbiddenRuleTarget,
  type ForbiddenRuleType,
} from "@/lib/api";

const RULE_TYPE_OPTIONS: { value: ForbiddenRuleType; label: string }[] = [
  { value: "word", label: "단어" },
  { value: "phrase", label: "문구" },
  { value: "regex", label: "정규식" },
];

const SEVERITY_OPTIONS: { value: ForbiddenRuleSeverity; label: string }[] = [
  { value: "block", label: "차단" },
  { value: "warn", label: "경고" },
  { value: "info", label: "안내" },
];

const TARGET_OPTIONS: { value: ForbiddenRuleTarget; label: string }[] = [
  { value: "both", label: "입력+응답" },
  { value: "user_input", label: "사용자 입력" },
  { value: "bot_output", label: "봇 응답" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "카테고리 없음" },
  { value: "violence", label: "폭력" },
  { value: "abuse", label: "욕설/비하" },
  { value: "privacy", label: "개인정보" },
  { value: "sexual", label: "성적 표현" },
  { value: "self_harm", label: "자해/위험 행동" },
];

const CUSTOM_CATEGORY_VALUE = "__custom__";
const CATEGORY_SELECT_OPTIONS = [
  ...CATEGORY_OPTIONS,
  { value: CUSTOM_CATEGORY_VALUE, label: "직접입력" },
];
const PRESET_CATEGORY_VALUES = CATEGORY_OPTIONS
  .map((option) => option.value)
  .filter(Boolean);

const EMPTY_FORM: ForbiddenRulePayload = {
  pattern: "",
  rule_type: "word",
  description: "",
  severity: "warn",
  target: "both",
  category: "",
  is_active: true,
};

function toPayload(rule: ForbiddenRuleResponse): ForbiddenRulePayload {
  return {
    pattern: rule.pattern,
    rule_type: rule.rule_type,
    description: rule.description ?? "",
    severity: rule.severity,
    target: rule.target,
    category: rule.category ?? "",
    is_active: rule.is_active,
  };
}

function cleanPayload(payload: ForbiddenRulePayload): ForbiddenRulePayload {
  const category = payload.category?.trim();

  return {
    ...payload,
    pattern: payload.pattern.trim(),
    description: payload.description?.trim() || null,
    category: category && category !== CUSTOM_CATEGORY_VALUE ? category : null,
  };
}

function getCategorySelectValue(category?: string | null) {
  if (!category) return "";
  return PRESET_CATEGORY_VALUES.includes(category) ? category : CUSTOM_CATEGORY_VALUE;
}

function shouldShowCustomCategory(category?: string | null) {
  return Boolean(category && getCategorySelectValue(category) === CUSTOM_CATEGORY_VALUE);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ForbiddenRulesPage() {
  const [rules, setRules] = useState<ForbiddenRuleResponse[]>([]);
  const [newRule, setNewRule] = useState<ForbiddenRulePayload>(EMPTY_FORM);
  const [drafts, setDrafts] = useState<Record<string, ForbiddenRulePayload>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeCount = useMemo(
    () => rules.filter((rule) => rule.is_active).length,
    [rules],
  );

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await adminForbiddenRulesApi.list();
      setRules(data);
      setDrafts({});
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "금지어 목록을 불러오지 못했습니다",
        text: "서버 연결 또는 API 설정을 확인해주세요.",
        confirmButtonColor: "#c7a8ff",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    adminForbiddenRulesApi
      .list()
      .then((data) => {
        if (!isMounted) return;
        setRules(data);
        setDrafts({});
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "금지어 목록을 불러오지 못했습니다",
          text: "서버 연결 또는 API 설정을 확인해주세요.",
          confirmButtonColor: "#c7a8ff",
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateNewRule = <K extends keyof ForbiddenRulePayload>(
    key: K,
    value: ForbiddenRulePayload[K],
  ) => {
    setNewRule((prev) => ({ ...prev, [key]: value }));
  };

  const updateDraft = <K extends keyof ForbiddenRulePayload>(
    id: string,
    base: ForbiddenRuleResponse,
    key: K,
    value: ForbiddenRulePayload[K],
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? toPayload(base)),
        [key]: value,
      },
    }));
  };

  const handleCreate = async () => {
    const payload = cleanPayload(newRule);
    if (!payload.pattern) {
      Swal.fire({
        icon: "warning",
        title: "패턴을 입력해주세요",
        confirmButtonColor: "#c7a8ff",
      });
      return;
    }

    setIsCreating(true);
    try {
      const created = await adminForbiddenRulesApi.create(payload);
      setRules((prev) => [created, ...prev]);
      setNewRule(EMPTY_FORM);
      await Swal.fire({
        icon: "success",
        title: "금지어가 추가되었습니다",
        confirmButtonColor: "#c7a8ff",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "추가에 실패했습니다",
        text: "입력값과 서버 상태를 확인해주세요.",
        confirmButtonColor: "#c7a8ff",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async (rule: ForbiddenRuleResponse) => {
    const payload = cleanPayload(drafts[rule.id] ?? toPayload(rule));
    if (!payload.pattern) {
      Swal.fire({
        icon: "warning",
        title: "패턴을 입력해주세요",
        confirmButtonColor: "#c7a8ff",
      });
      return;
    }

    setSavingId(rule.id);
    try {
      const updated = await adminForbiddenRulesApi.update(rule.id, payload);
      setRules((prev) => prev.map((item) => (item.id === rule.id ? updated : item)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[rule.id];
        return next;
      });
      await Swal.fire({
        icon: "success",
        title: "저장되었습니다",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "저장에 실패했습니다",
        text: "입력값과 서버 상태를 확인해주세요.",
        confirmButtonColor: "#c7a8ff",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (rule: ForbiddenRuleResponse) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "이 규칙을 삭제할까요?",
      text: rule.pattern,
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      confirmButtonColor: "#e05f7f",
      cancelButtonColor: "#c7a8ff",
    });

    if (!result.isConfirmed) return;

    setSavingId(rule.id);
    try {
      await adminForbiddenRulesApi.delete(rule.id);
      setRules((prev) => prev.filter((item) => item.id !== rule.id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[rule.id];
        return next;
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "삭제에 실패했습니다",
        confirmButtonColor: "#c7a8ff",
      });
    } finally {
      setSavingId(null);
    }
  };

  const inputCls =
    "w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]";
  const textareaCls =
    "w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-none focus:border-[#c7a8ff]";
  const labelCls = "block text-[10px] font-bold text-[#9b74ad] mb-1.5";

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">금지어 관리</h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            전체 캐릭터에 공통 적용할 금지어와 안전 규칙을 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRules}
          disabled={isLoading}
          className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] disabled:opacity-60"
        >
          새로고침
        </button>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)] mb-3.5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h4 className="m-0 text-[15px] text-[#72508c]">금지어 추가</h4>
          <span className="text-[11px] text-[#94859d]">
            활성 규칙 {activeCount}개 / 전체 {rules.length}개
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-3">
            <label className={labelCls}>패턴</label>
            <input
              type="text"
              value={newRule.pattern}
              onChange={(event) => updateNewRule("pattern", event.target.value)}
              placeholder="예: 죽어, 바보"
              className={inputCls}
            />
          </div>
          <div className="lg:col-span-2">
            <label className={labelCls}>검사 방식</label>
            <select
              value={newRule.rule_type}
              onChange={(event) =>
                updateNewRule("rule_type", event.target.value as ForbiddenRuleType)
              }
              className={inputCls}
            >
              {RULE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className={labelCls}>강도</label>
            <select
              value={newRule.severity}
              onChange={(event) =>
                updateNewRule("severity", event.target.value as ForbiddenRuleSeverity)
              }
              className={inputCls}
            >
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className={labelCls}>적용 대상</label>
            <select
              value={newRule.target}
              onChange={(event) =>
                updateNewRule("target", event.target.value as ForbiddenRuleTarget)
              }
              className={inputCls}
            >
              {TARGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className={labelCls}>카테고리</label>
            <select
              value={getCategorySelectValue(newRule.category)}
              onChange={(event) => updateNewRule("category", event.target.value)}
              className={inputCls}
            >
              {CATEGORY_SELECT_OPTIONS.map((option) => (
                <option key={option.value || "none"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {shouldShowCustomCategory(newRule.category) && (
              <input
                type="text"
                value={newRule.category === CUSTOM_CATEGORY_VALUE ? "" : newRule.category ?? ""}
                onChange={(event) => updateNewRule("category", event.target.value)}
                placeholder="직접 입력"
                className={inputCls + " mt-2"}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <label className={labelCls}>활성</label>
            <label className="flex h-[34px] items-center gap-2 rounded-xl border border-[#eadcf0] bg-white px-2.5 text-[12px] text-[#74617a]">
              <input
                type="checkbox"
                checked={newRule.is_active}
                onChange={(event) => updateNewRule("is_active", event.target.checked)}
              />
              사용
            </label>
          </div>
          <div className="lg:col-span-10">
            <label className={labelCls}>설명</label>
            <textarea
              value={newRule.description ?? ""}
              onChange={(event) => updateNewRule("description", event.target.value)}
              placeholder="운영자가 나중에 규칙 의도를 알 수 있도록 적어주세요."
              rows={2}
              className={textareaCls}
            />
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] disabled:opacity-60"
            >
              {isCreating ? "추가 중..." : "금지어 추가"}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
        <h4 className="m-0 mb-3 text-[15px] text-[#72508c]">등록된 금지어</h4>
        {isLoading ? (
          <p className="text-[12px] text-[#94859d] text-center py-8">불러오는 중...</p>
        ) : rules.length === 0 ? (
          <p className="text-[12px] text-[#94859d] text-center py-8">
            아직 등록된 금지어가 없습니다.
          </p>
        ) : (
          <div className="grid gap-3">
            {rules.map((rule) => {
              const draft = drafts[rule.id] ?? toPayload(rule);
              const isDirty = Boolean(drafts[rule.id]);
              const isSaving = savingId === rule.id;

              return (
                <div
                  key={rule.id}
                  className="border border-[#eadcf0] rounded-2xl p-3 bg-[#fff9fc]"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-3">
                      <label className={labelCls}>패턴</label>
                      <input
                        type="text"
                        value={draft.pattern}
                        onChange={(event) =>
                          updateDraft(rule.id, rule, "pattern", event.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className={labelCls}>검사 방식</label>
                      <select
                        value={draft.rule_type}
                        onChange={(event) =>
                          updateDraft(
                            rule.id,
                            rule,
                            "rule_type",
                            event.target.value as ForbiddenRuleType,
                          )
                        }
                        className={inputCls}
                      >
                        {RULE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <label className={labelCls}>강도</label>
                      <select
                        value={draft.severity}
                        onChange={(event) =>
                          updateDraft(
                            rule.id,
                            rule,
                            "severity",
                            event.target.value as ForbiddenRuleSeverity,
                          )
                        }
                        className={inputCls}
                      >
                        {SEVERITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <label className={labelCls}>적용 대상</label>
                      <select
                        value={draft.target}
                        onChange={(event) =>
                          updateDraft(
                            rule.id,
                            rule,
                            "target",
                            event.target.value as ForbiddenRuleTarget,
                          )
                        }
                        className={inputCls}
                      >
                        {TARGET_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <label className={labelCls}>카테고리</label>
                      <select
                        value={getCategorySelectValue(draft.category)}
                        onChange={(event) =>
                          updateDraft(rule.id, rule, "category", event.target.value)
                        }
                        className={inputCls}
                      >
                        {CATEGORY_SELECT_OPTIONS.map((option) => (
                          <option key={option.value || "none"} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {shouldShowCustomCategory(draft.category) && (
                        <input
                          type="text"
                          value={draft.category === CUSTOM_CATEGORY_VALUE ? "" : draft.category ?? ""}
                          onChange={(event) =>
                            updateDraft(rule.id, rule, "category", event.target.value)
                          }
                          placeholder="직접 입력"
                          className={inputCls + " mt-2"}
                        />
                      )}
                    </div>
                    <div className="lg:col-span-1">
                      <label className={labelCls}>활성</label>
                      <label className="flex h-[34px] items-center gap-2 rounded-xl border border-[#eadcf0] bg-white px-2.5 text-[12px] text-[#74617a]">
                        <input
                          type="checkbox"
                          checked={draft.is_active}
                          onChange={(event) =>
                            updateDraft(rule.id, rule, "is_active", event.target.checked)
                          }
                        />
                        사용
                      </label>
                    </div>
                    <div className="lg:col-span-8">
                      <label className={labelCls}>설명</label>
                      <textarea
                        value={draft.description ?? ""}
                        onChange={(event) =>
                          updateDraft(rule.id, rule, "description", event.target.value)
                        }
                        rows={2}
                        className={textareaCls}
                      />
                    </div>
                    <div className="lg:col-span-4 flex flex-col justify-between gap-2">
                      <p className="m-0 text-[11px] leading-relaxed text-[#94859d]">
                        생성: {formatDate(rule.created_at)}
                        <br />
                        수정: {formatDate(rule.updated_at)}
                      </p>
                      <div className="flex justify-end gap-2">
                        {isDirty && (
                          <button
                            type="button"
                            onClick={() =>
                              setDrafts((prev) => {
                                const next = { ...prev };
                                delete next[rule.id];
                                return next;
                              })
                            }
                            className="rounded-full px-3 py-2 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0]"
                          >
                            되돌리기
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(rule)}
                          disabled={isSaving}
                          className="rounded-full px-3 py-2 text-[12px] font-bold text-[#b84764] bg-white border border-[#f1c8d4] disabled:opacity-60"
                        >
                          삭제
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(rule)}
                          disabled={isSaving}
                          className="rounded-full px-4 py-2 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] disabled:opacity-60"
                        >
                          {isSaving ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
