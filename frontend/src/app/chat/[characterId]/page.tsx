import { AppShell } from "../../../components/layout/AppShell";
import { CharacterChatShell } from "../../../components/chat/CharacterChatShell";

type ChatPageProps = {
  params: Promise<{ characterId: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { characterId } = await params;

  return (
    <AppShell>
      <CharacterChatShell characterId={characterId} />
    </AppShell>
  );
}
