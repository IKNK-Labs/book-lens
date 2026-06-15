import type { ReactNode } from "react";
import type { Viewer } from "../../lib/mockAuth";
import { getGuestViewer } from "../../lib/mockAuth";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";

export function AppShell({ children, viewer = getGuestViewer() }: { children: ReactNode; viewer?: Viewer }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader viewer={viewer} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      <AppFooter viewer={viewer} />
    </div>
  );
}
