import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/layout/AppShell";
import { BookDetailContent } from "../../../components/books/BookDetailContent";
import { mockBooks } from "../../../data/mock";
import { getViewer } from "../../../lib/mockAuth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auth?: string }>;
};

function isPositiveIntegerId(value: string) {
  return /^[1-9]\d*$/.test(value);
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || "http";
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");

  if (!host) return null;

  return `${protocol}://${host}`;
}

async function assertBookExists(id: string) {
  if (!isPositiveIntegerId(id)) {
    if (!mockBooks.some((book) => book.id === id)) notFound();
    return;
  }

  const origin = await getRequestOrigin();
  if (!origin) return;

  const response = await fetch(`${origin}/api/books/${id}`, {
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
