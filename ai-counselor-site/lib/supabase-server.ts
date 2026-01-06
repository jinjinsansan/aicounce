import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let serverClient: ReturnType<typeof createClient<Database>> | null = null;

const getSupabaseServiceUrl = () =>
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

export const hasServiceRole = () =>
  Boolean(getSupabaseServiceUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function getServiceSupabase() {
  if (!hasServiceRole()) {
    throw new Error("Supabase service role key is not configured");
  }

  const serviceUrl = getSupabaseServiceUrl();
  if (!serviceUrl) {
    throw new Error("SUPABASE_URL is not configured");
  }

  if (!serverClient) {
    serverClient = createClient<Database>(
      serviceUrl,
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
