import { redirect } from "next/navigation";
import { AppShell } from "../../components/layout/AppShell";
import { ChatSessionWorkspace } from "../../components/chat/ChatSessionWorkspace";
import { getLoginRedirect } from "../../lib/authNext";
import { getViewer } from "../../lib/mockAuth";

type ChatPageProps = {
  searchParams: Promise<{ auth?: string; session_id?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const query = await searchParams;
  const viewer = await getViewer(query);

  if (!viewer.isMember) {
    redirect(getLoginRedirect("대화를 이어가려면 로그인이 필요합니다.", "/chat"));
  }

  return (
    <AppShell viewer={viewer}>
      <ChatSessionWorkspace />
    </AppShell>
  );
}
