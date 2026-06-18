import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { asSessionCookie } from "./cookies";
import {
  getMissingSupabaseConfigMessage,
  getSupabaseConfig,
} from "./env";

const ADMIN_LOGIN_PATH = "/admin/login";
const USER_PROTECTED_PATHS = ["/settings", "/chat"];

function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isUserProtectedRoute(pathname: string) {
  return USER_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
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

  if (!supabaseConfig) {
    if (
      process.env.NODE_ENV !== "production" &&
      isUserProtectedRoute(pathname) &&
      request.nextUrl.searchParams.get("auth") === "member"
    ) {
      return supabaseResponse;
    }

    if (isUserProtectedRoute(pathname) || isAdminRoute(pathname)) {
      const loginUrl = new URL(
        isAdminRoute(pathname) ? ADMIN_LOGIN_PATH : "/login",
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
    return redirectWithCookies(
      supabaseResponse,
      new URL(ADMIN_LOGIN_PATH, request.url),
    );
  }

  if (!(await isActiveAdmin(supabase, userId))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "관리자 권한이 필요합니다");

    return redirectWithCookies(supabaseResponse, loginUrl);
  }

  return supabaseResponse;
}
