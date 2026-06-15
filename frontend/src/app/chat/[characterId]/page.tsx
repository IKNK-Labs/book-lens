import { AppShell } from "../../../components/layout/AppShell";
import { CharacterChatShell } from "../../../components/chat/CharacterChatShell";
import { getViewer } from "../../../lib/mockAuth";

type ChatPageProps = {
  params: Promise<{ characterId: string }>;
  searchParams: Promise<{ auth?: string }>;
};

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const [{ characterId }, authParams] = await Promise.all([params, searchParams]);
  const viewer = getViewer(authParams);

  return (
    <AppShell viewer={viewer}>
      <CharacterChatShell characterId={characterId} />
    </AppShell>
  );
}
