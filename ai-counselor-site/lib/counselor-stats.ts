import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";

export async function incrementCounselorSessionCount(
  counselorId: string,
  client?: SupabaseClient<Database>,
) {
  if (!counselorId) return;

  const supabase = client ?? (hasServiceRole() ? getServiceSupabase() : null);
  if (!supabase) {
    console.warn("Service role is not available; cannot update counselor stats");
    return;
  }

  const { error } = await supabase.rpc("increment_counselor_session", {
    target_counselor: counselorId,
  });

  if (error) {
    console.error("Failed to increment counselor session count", error);
  }
}
