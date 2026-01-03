import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-clients";

const PROTECTED_PATHS = [
  "/counselor",
  "/api/chat",
  "/api/conversations",
  "/api/michelle",
  "/admin",
  "/api/admin",
];

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const requiresAuth = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!session && requiresAuth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set(
      "redirectTo",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/counselor/:path*",
    "/api/chat",
    "/api/conversations/:path*",
    "/api/michelle/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
