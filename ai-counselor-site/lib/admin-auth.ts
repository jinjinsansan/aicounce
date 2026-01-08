import { getServiceSupabase } from "@/lib/supabase-server";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/constants/admin";

/**
 * Validates admin authentication for API routes
 * Returns null if authorized, or NextResponse with error if unauthorized
 */
export async function validateAdminAuth(): Promise<NextResponse | null> {
  // Use session-aware client to get current user
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

/**
 * Gets authenticated Supabase client for admin routes
 * Returns tuple of [supabase, errorResponse]
 * If errorResponse is not null, handler should return it immediately
 * 
 * Note: Returns service role client (bypasses RLS) for admin operations
 */
export async function getAdminSupabase(): Promise<
  [ReturnType<typeof getServiceSupabase>, NextResponse | null]
> {
  const authError = await validateAdminAuth();
  if (authError) {
    return [getServiceSupabase(), authError];
  }
  return [getServiceSupabase(), null];
}
