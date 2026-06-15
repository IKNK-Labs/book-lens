import { AppShell } from "../../components/layout/AppShell";
import { BookSearchShell } from "../../components/books/BookSearchShell";
import { getViewer } from "../../lib/mockAuth";

type BooksPageProps = { searchParams: Promise<{ auth?: string }> };

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const viewer = getViewer(await searchParams);

  return (
    <AppShell viewer={viewer}>
      <BookSearchShell isMember={viewer.isMember} />
    </AppShell>
  );
}
