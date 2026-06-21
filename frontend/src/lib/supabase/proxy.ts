import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { asSessionCookie } from "./cookies";
import {
  getMissingSupabaseConfigMessage,
  getSupabaseConfig,
} from "./env";

const ADMIN_LOGIN_PATH = "/admin/login";
const USER_PROTECTED_PATHS = ["/settings", "/chat"];

function isAdminPageRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminApiRoute(pathname: string) {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function isAdminRoute(pathname: string) {
  return isAdminPageRoute(pathname) || isAdminApiRoute(pathname);
}

function adminApiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function isUserProtectedRoute(pathname: string) {
  return USER_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isChatRoute(pathname: string) {
  return pathname === "/chat" || pathname.startsWith("/chat/");
}

function isMockChatPreview(request: NextRequest, pathname: string) {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_MOCK_AUTH_PREVIEW === "true" &&
    isChatRoute(pathname) &&
    request.nextUrl.searchParams.get("auth") === "member"
  );
}

function redirectWithCookies(response: NextResponse, destination: URL) {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

async function isActiveAdmin(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
) {
  const { data: adminUser, error: adminUserError } = await supabase
    .from("admin_user")
    .select("role, is_active")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (adminUserError) {
    console.error("Failed to check admin permission", adminUserError);
  }

  return adminUser?.role === "admin" && adminUser.is_active === true;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const pathname = request.nextUrl.pathname;
  const supabaseConfig = getSupabaseConfig();

  // Dev-only preview bypass for Playwright/mock chat UI checks.
  if (isMockChatPreview(request, pathname)) {
    return supabaseResponse;
  }

  if (!supabaseConfig) {
    if (
      isUserProtectedRoute(pathname) ||
      (isAdminRoute(pathname) && pathname !== ADMIN_LOGIN_PATH)
    ) {
      if (isAdminApiRoute(pathname)) {
        return adminApiError(503, getMissingSupabaseConfigMessage());
      }

      const loginUrl = new URL(
        isAdminPageRoute(pathname) ? ADMIN_LOGIN_PATH : "/login",
        request.url,
      );
      loginUrl.searchParams.set("error", getMissingSupabaseConfigMessage());

      return redirectWithCookies(supabaseResponse, loginUrl);
    }

    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(
              name,
              value,
              asSessionCookie(options),
            );
          });
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (isUserProtectedRoute(pathname)) {
    if (!userId) {
      return redirectWithCookies(
        supabaseResponse,
        new URL("/login", request.url),
      );
    }

    if (await isActiveAdmin(supabase, userId)) {
      return redirectWithCookies(
        supabaseResponse,
        new URL("/admin", request.url),
      );
    }
  }

  if (!isAdminRoute(pathname) || pathname === ADMIN_LOGIN_PATH) {
    return supabaseResponse;
  }

  if (!userId) {
    if (isAdminApiRoute(pathname)) {
      return adminApiError(401, "관리자 로그인이 필요합니다");
    }

    return redirectWithCookies(
      supabaseResponse,
      new URL(ADMIN_LOGIN_PATH, request.url),
    );
  }

  if (!(await isActiveAdmin(supabase, userId))) {
    if (isAdminApiRoute(pathname)) {
      return adminApiError(403, "관리자 권한이 필요합니다");
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "관리자 권한이 필요합니다");

    return redirectWithCookies(supabaseResponse, loginUrl);
  }

  return supabaseResponse;
}
