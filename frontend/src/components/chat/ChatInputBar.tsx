type ChatInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export function ChatInputBar({ value, onChange, onSend, disabled }: ChatInputBarProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  }

  return (
    <div className="border-t border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-end gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface-soft)] p-2">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[var(--muted)] disabled:opacity-50"
          placeholder="캐릭터에게 물어보기..."
          aria-label="채팅 메시지"
        />
        <button
          type="button"
          onClick={() => { if (value.trim()) onSend(); }}
          disabled={disabled || !value.trim()}
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-black text-white disabled:opacity-40"
          aria-label="메시지 전송"
        >
          전송
        </button>
      </div>
    </div>
  );
}
