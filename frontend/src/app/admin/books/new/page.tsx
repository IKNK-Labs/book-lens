"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { adminBooksApi, ApiError } from "@/lib/api";

type BookForm = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  content: string;
};

const REQUIRED_FIELDS: { key: keyof BookForm; label: string }[] = [
  { key: "title", label: "제목" },
  { key: "author", label: "저자" },
  { key: "publisher", label: "출판사" },
  { key: "description", label: "줄거리" },
];

const inputCls =
  "w-full min-h-[34px] bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-1.5 outline-none focus:border-[#c7a8ff]";
const fieldWrapCls = "bg-[#fff9fc] border border-[#eadcf0] rounded-2xl p-2.5";
const labelCls = "block text-[10px] font-bold text-[#9b74ad] mb-1.5";

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState<BookForm>({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    description: "",
    content: "",
  });
  const [autocompleteTitle, setAutocompleteTitle] = useState("");
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const scanFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      stopStream(cameraStream);
    };
  }, [cameraStream]);

  const updateField = (field: keyof BookForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAutocomplete = async () => {
    const titleToSearch = autocompleteTitle.trim() || form.title.trim();
    if (!titleToSearch) {
      Swal.fire({
        icon: "warning",
        title: "제목 미입력",
        text: "자동완성할 동화책 제목을 입력해주세요.",
        confirmButtonColor: "#c7a8ff",
      });
      return;
    }

    setIsAutocompleting(true);
    try {
      const res = await fetch("/api/admin/books/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleToSearch }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "자동완성에 실패했습니다.");
      }

      const data = await res.json() as {
        author?: string;
        publisher?: string;
        description?: string;
        content?: string;
      };
      setAutocompleteTitle("");
      setForm((prev) => ({
        ...prev,
        title: titleToSearch,
        author: data.author || prev.author,
        publisher: data.publisher || prev.publisher,
        description: data.description || prev.description,
        content: data.content || prev.content,
      }));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "자동완성 실패",
        text: err instanceof Error ? err.message : "서버에 연결할 수 없습니다.",
        confirmButtonColor: "#c7a8ff",
      });
    } finally {
      setIsAutocompleting(false);
    }
  };

  const sendScanRequest = async (blob: Blob) => {
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append("image", blob, "scan.jpg");

      const res = await fetch("/api/admin/books/scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "스캔에 실패했습니다.");
      }

      const data = await res.json() as {
        isbn?: string; title?: string; author?: string;
        publisher?: string; description?: string; content?: string;
      };
      setForm((prev) => ({
        ...prev,
        isbn: data.isbn || prev.isbn,
        title: data.title || prev.title,
        author: data.author || prev.author,
        publisher: data.publisher || prev.publisher,
        description: data.description || prev.description,
        content: data.content || prev.content,
      }));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "ISBN 스캔 실패",
        text: err instanceof Error ? err.message : "서버에 연결할 수 없습니다.",
        confirmButtonColor: "#c7a8ff",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch {
      // 카메라 권한 거부 또는 장치 없음 → 파일 선택으로 폴백
      scanFileInputRef.current?.click();
    }
  };

  const closeCamera = () => {
    stopStream(cameraStream);
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      closeCamera();
      await sendScanRequest(blob);
    }, "image/jpeg", 0.92);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await sendScanRequest(file);
  };

  const validate = () => {
    const missing = REQUIRED_FIELDS.filter((field) => !form[field.key].trim());
    if (missing.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "필수 항목 미입력",
        html: missing.map((field) => `<b>${field.label}</b>`).join(", ") + " 값을 입력해 주세요.",
        confirmButtonText: "확인",
        confirmButtonColor: "#c7a8ff",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await adminBooksApi.create({
        isbn: form.isbn.trim() || null,
        title: form.title.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim(),
        description: form.description.trim(),
        content: form.content.trim() || undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "등록되었습니다.",
        text: `"${form.title.trim()}" 도서가 등록되었습니다.`,
        confirmButtonText: "확인",
        confirmButtonColor: "#c7a8ff",
      });

      router.push("/admin/books");
    } catch (err) {
      if (err instanceof ApiError) {
        const messages = Object.entries(err.data)
          .map(([field, msg]) => {
            const label = REQUIRED_FIELDS.find((item) => item.key === field)?.label ?? field;
            const text = Array.isArray(msg) ? (msg as string[]).join(" ") : String(msg);
            return `<b>${label}</b>: ${text}`;
          })
          .join("<br>");

        Swal.fire({
          icon: "error",
          title: "저장 실패",
          html: messages || "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
          confirmButtonText: "확인",
          confirmButtonColor: "#c7a8ff",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "네트워크 오류",
          text: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          confirmButtonText: "확인",
          confirmButtonColor: "#c7a8ff",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* 웹캠 촬영 모달 */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-3xl p-4 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-[14px] font-bold text-[#7d5ba6] mb-3">📷 ISBN 바코드 스캔</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-2xl bg-black aspect-video object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-[11px] text-[#94859d] mt-2 mb-3 text-center">
              바코드가 화면에 잘 보이도록 맞추고 촬영하세요
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={captureFrame}
                className="flex-1 rounded-full py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2]"
              >
                촬영
              </button>
              <button
                type="button"
                onClick={() => { closeCamera(); scanFileInputRef.current?.click(); }}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] border border-[#eadcf0] whitespace-nowrap"
              >
                파일 선택
              </button>
              <button
                type="button"
                onClick={closeCamera}
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] border border-[#eadcf0]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-2xl tracking-tight text-[#7d5ba6] m-0">동화책 등록</h3>
          <p className="mt-1.5 text-[13px] text-[#94859d]">
            제목을 입력하고 AI 자동완성으로 정보를 채우거나 직접 입력하세요.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/books"
            className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#8b69a3] bg-white border border-[#eadcf0] whitespace-nowrap"
          >
            취소
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <section className="bg-white border border-[#eadcf0] rounded-3xl p-4 shadow-[0_10px_26px_rgba(180,140,205,0.13)]">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button
            type="button"
            onClick={() => autocompleteInputRef.current?.focus()}
            className="flex-1 rounded-2xl border border-dashed border-[#d9c7ff] bg-[#fff0f7] px-4 py-3 text-left text-[12px] text-[#6f6174]"
          >
            <b className="block text-[#7d5ba6] mb-1">✨ LLM 자동완성</b>
            제목을 기반으로 저자, 출판사, 줄거리를 AI가 채워줍니다.
          </button>
          <button
            type="button"
            onClick={openCamera}
            disabled={isScanning}
            className="flex-1 rounded-2xl border border-dashed border-[#d9c7ff] bg-[#fff0f7] px-4 py-3 text-left text-[12px] text-[#6f6174] disabled:opacity-60"
          >
            <b className="block text-[#7d5ba6] mb-1">📷 ISBN 스캔</b>
            {isScanning ? "스캔 중..." : "웹캠으로 바코드를 촬영해서 도서 정보를 불러옵니다."}
          </button>
          {/* 파일 선택 폴백 (카메라 권한 거부 시) */}
          <input
            ref={scanFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div className={fieldWrapCls + " mb-4"}>
          <label className={labelCls}>✨ AI 자동완성 — 제목으로 저자·출판사·줄거리 채우기</label>
          <div className="flex gap-2">
            <input
              ref={autocompleteInputRef}
              type="text"
              value={autocompleteTitle}
              onChange={(event) => setAutocompleteTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleAutocomplete();
              }}
              placeholder="동화책 제목을 입력하세요 (예: 백설공주, 어린왕자)"
              className={inputCls + " flex-1"}
            />
            <button
              type="button"
              onClick={handleAutocomplete}
              disabled={isAutocompleting}
              className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white bg-gradient-to-br from-[#c7a8ff] to-[#f6a9d2] whitespace-nowrap disabled:opacity-60"
            >
              {isAutocompleting ? "생성 중..." : "AI 자동완성"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={fieldWrapCls}>
            <label className={labelCls}>ISBN</label>
            <input
              type="text"
              value={form.isbn}
              onChange={(event) => updateField("isbn", event.target.value)}
              placeholder="예: 9788925557373"
              className={inputCls}
            />
          </div>

          <div className={fieldWrapCls}>
            <label className={labelCls}>
              제목 <span className="text-[#f0a0b0]">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="동화책 제목을 입력하세요"
              className={inputCls}
            />
          </div>

          <div className={fieldWrapCls}>
            <label className={labelCls}>
              저자 <span className="text-[#f0a0b0]">*</span>
            </label>
            <input
              type="text"
              value={form.author}
              onChange={(event) => updateField("author", event.target.value)}
              placeholder="저자명을 입력하세요"
              className={inputCls}
            />
          </div>

          <div className={fieldWrapCls}>
            <label className={labelCls}>
              출판사 <span className="text-[#f0a0b0]">*</span>
            </label>
            <input
              type="text"
              value={form.publisher}
              onChange={(event) => updateField("publisher", event.target.value)}
              placeholder="출판사명을 입력하세요"
              className={inputCls}
            />
          </div>

          <div className={fieldWrapCls + " sm:col-span-2"}>
            <label className={labelCls}>
              줄거리 <span className="text-[#f0a0b0]">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="동화책의 줄거리를 입력하세요"
              rows={6}
              className="w-full bg-white border border-[#eadcf0] rounded-xl text-[12px] text-[#74617a] px-2.5 py-2 outline-none resize-y focus:border-[#c7a8ff]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
