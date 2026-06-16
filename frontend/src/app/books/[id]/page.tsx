import { AppShell } from "../../../components/layout/AppShell";
import { BookDetailContent } from "../../../components/books/BookDetailContent";
import { getViewer } from "../../../lib/mockAuth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auth?: string }>;
};

export default async function BookDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, authParams] = await Promise.all([params, searchParams]);
  const viewer = await getViewer(authParams);

  return (
    <AppShell viewer={viewer}>
      <BookDetailContent bookId={id} />
    </AppShell>
  );
}
