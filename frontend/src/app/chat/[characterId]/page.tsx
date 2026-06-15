import { redirect } from "next/navigation";
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

  if (!viewer.isMember) {
    redirect(`/login?message=${encodeURIComponent("캐릭터와 대화하려면 로그인이 필요합니다.")}`);
  }

  return (
    <AppShell viewer={viewer}>
      <CharacterChatShell characterId={characterId} />
    </AppShell>
  );
}
