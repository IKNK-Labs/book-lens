import { notFound } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { BookDetailContent } from "../../../components/books/BookDetailContent";
import { mockBooks } from "../../../data/mock";
import { getViewer } from "../../../lib/mockAuth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auth?: string }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function isPositiveIntegerId(value: string) {
  return /^[1-9]\d*$/.test(value);
}

async function assertBookExists(id: string) {
  if (!isPositiveIntegerId(id)) {
    if (!mockBooks.some((book) => book.id === id)) notFound();
    return;
  }

  const baseUrl = API_URL.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/books/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) notFound();
}

export default async function BookDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, authParams] = await Promise.all([params, searchParams]);
  await assertBookExists(id);
  const viewer = await getViewer(authParams);

  return (
    <AppShell viewer={viewer}>
      <BookDetailContent bookId={id} />
    </AppShell>
  );
}
