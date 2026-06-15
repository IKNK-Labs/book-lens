import { mockCharacters, mockMessagesByCharacterId } from "../../data/mock";
import { Card } from "../ui/Card";
import { ChatBubble } from "./ChatBubble";
import { ChatInputBar } from "./ChatInputBar";

export function CharacterChatShell({ characterId }: { characterId: string }) {
  const character = mockCharacters.find((item) => item.id === characterId) ?? mockCharacters[0];
  const messages = mockMessagesByCharacterId[character.id] ?? mockMessagesByCharacterId.witch;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="grid gap-4 self-start">
        <Card>
          <div className="grid place-items-center rounded-[26px] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--accent-soft)] to-[var(--surface-muted)] p-8 text-7xl">
            {character.avatarEmoji}
          </div>
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">{character.bookTitle}</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--accent-strong)]">{character.name}</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{character.shortBio}</p>
            <p className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-xs leading-5 text-[var(--muted)]">
              {character.personaNote}
            </p>
          </div>
        </Card>
      </aside>
      <section className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4">
          <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--foreground)]">{character.name}와의 대화</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">현재는 mock 메시지 기반 UI shell입니다.</p>
        </div>
        <div className="grid min-h-[440px] content-start gap-4 p-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
        <ChatInputBar />
      </section>
    </div>
  );
}
