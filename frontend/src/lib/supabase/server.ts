import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { asSessionCookie } from "./cookies";
import { requireSupabaseConfig } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = requireSupabaseConfig();

  return createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, asSessionCookie(options));
            });
          } catch {
            // Server Components cannot write cookies. Server Actions and Route
            // Handlers still can, and the proxy keeps sessions refreshed.
          }
        },
      },
    },
  );
}
