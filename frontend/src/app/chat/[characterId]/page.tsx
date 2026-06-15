import { redirect } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { CharacterChatShell } from "../../../components/chat/CharacterChatShell";
import { getLoginRedirect } from "../../../lib/authNext";
import { getViewer } from "../../../lib/mockAuth";

type ChatPageProps = {
  params: Promise<{ characterId: string }>;
  searchParams: Promise<{ auth?: string }>;
};

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const [{ characterId }, authParams] = await Promise.all([params, searchParams]);
  const viewer = await getViewer(authParams);

  if (!viewer.isMember) {
    redirect(getLoginRedirect("캐릭터와 대화하려면 로그인이 필요합니다.", `/chat/${characterId}`));
  }

  return (
    <AppShell viewer={viewer}>
      <CharacterChatShell characterId={characterId} />
    </AppShell>
  );
}
