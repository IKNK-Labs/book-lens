export function ChatInputBar() {
  return (
    <div className="border-t border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-end gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface-soft)] p-2">
        <textarea
          rows={1}
          className="min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[var(--muted)]"
          placeholder="캐릭터에게 물어보기..."
          aria-label="채팅 메시지"
        />
        <button
          type="button"
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-black text-white"
          aria-label="메시지 전송"
        >
          전송
        </button>
      </div>
    </div>
  );
}
