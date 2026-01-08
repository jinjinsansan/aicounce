import { getServiceSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/constants/admin";

/**
 * Validates admin authentication for API routes
 * Returns null if authorized, or NextResponse with error if unauthorized
 */
export async function validateAdminAuth(): Promise<NextResponse | null> {
  const supabase = getServiceSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

/**
 * Gets authenticated Supabase client for admin routes
 * Returns tuple of [supabase, errorResponse]
 * If errorResponse is not null, handler should return it immediately
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
