import { AppShell } from "../../components/layout/AppShell";
import { BookSearchShell } from "../../components/books/BookSearchShell";
import { getViewer } from "../../lib/mockAuth";

type BooksPageProps = { searchParams: Promise<{ auth?: string; search?: string }> };

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const params = await searchParams;
  const viewer = await getViewer(params);

  return (
    <AppShell viewer={viewer}>
      <BookSearchShell isMember={viewer.isMember} isPreview={viewer.isPreview} initialSearch={params.search ?? ""} />
    </AppShell>
  );
}
