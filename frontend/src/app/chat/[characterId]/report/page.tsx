import { redirect } from "next/navigation";
import { AppShell } from "../../../../components/layout/AppShell";
import { ConversationReportShell } from "../../../../components/chat/ConversationReportShell";
import { getLoginRedirect } from "../../../../lib/authNext";
import { getViewer } from "../../../../lib/mockAuth";

type ReportPageProps = {
  params: Promise<{ characterId: string }>;
  searchParams: Promise<{ auth?: string; log?: string }>;
};

export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const [{ characterId }, query] = await Promise.all([params, searchParams]);
  const viewer = await getViewer(query);

  if (!viewer.isMember) {
    redirect(getLoginRedirect("대화를 신고하려면 로그인이 필요합니다.", `/chat/${characterId}/report`));
  }

  return (
    <AppShell viewer={viewer}>
      <ConversationReportShell characterId={characterId} conversationLogId={query.log} />
    </AppShell>
  );
}
