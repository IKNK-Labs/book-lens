import { AppShell } from "../../components/layout/AppShell";
import { BookSearchShell } from "../../components/books/BookSearchShell";

export default function BooksPage() {
  return (
    <AppShell>
      <BookSearchShell />
    </AppShell>
  );
}
