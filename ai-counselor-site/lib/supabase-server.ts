import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let serverClient: ReturnType<typeof createClient<Database>> | null = null;

export const hasServiceRole = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

export function getServiceSupabase() {
  if (!hasServiceRole()) {
    throw new Error("Supabase service role key is not configured");
  }

  if (!serverClient) {
    serverClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }

  return serverClient;
}
