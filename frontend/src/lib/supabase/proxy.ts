import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { asSessionCookie } from "./cookies";

const ADMIN_LOGIN_PATH = "/admin/login";
const USER_PROTECTED_PATHS = ["/books", "/settings", "/chat"];

function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isUserProtectedRoute(pathname: string) {
  return USER_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectWithCookies(
  response: NextResponse,
  destination: URL,
) {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
  const pathname = request.nextUrl.pathname;
  const userId = claimsData?.claims.sub;

  if (isUserProtectedRoute(pathname) && !userId) {
    return redirectWithCookies(
      supabaseResponse,
      new URL("/login", request.url),
    );
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

  const { data: adminUser, error: adminUserError } = await supabase
    .from("admin_user")
    .select("role, is_active")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (adminUserError) {
    console.error("Failed to check admin permission", adminUserError);
  }

  const isAdmin =
    adminUser?.role === "admin" && adminUser.is_active === true;

  if (!isAdmin) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "관리자 권한이 필요합니다");

    return redirectWithCookies(supabaseResponse, loginUrl);
  }

  return supabaseResponse;
}
