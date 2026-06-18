import { AppShell } from "../../../../components/layout/AppShell";
import { CharacterSelectShell } from "../../../../components/books/CharacterSelectShell";
import { getViewer } from "../../../../lib/mockAuth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auth?: string }>;
};

export default async function BookCharactersPage({ params, searchParams }: PageProps) {
  const [{ id }, authParams] = await Promise.all([params, searchParams]);
  const viewer = await getViewer(authParams);

  return (
    <AppShell viewer={viewer}>
      <CharacterSelectShell bookId={id} />
    </AppShell>
  );
}
