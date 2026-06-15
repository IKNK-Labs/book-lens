import type { ChatMessage } from "../../data/mock";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-[var(--violet)] to-[var(--pink)] text-white"
            : "border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--foreground)]"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
