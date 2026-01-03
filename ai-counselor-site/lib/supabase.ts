import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export const hasSupabaseConfig = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

export function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase環境変数が設定されていません");
  }

  if (!browserClient) {
    browserClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }

  return browserClient;
}
