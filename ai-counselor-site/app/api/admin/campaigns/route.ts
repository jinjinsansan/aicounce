import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase } from "@/lib/supabase-server";

const ADMIN_EMAIL = "goldbenchan@gmail.com";

const createCampaignSchema = z.object({
  code: z.string().min(2).max(32),
  durationDays: z.number().min(1).max(365),
  description: z.string().max(200).optional(),
  usageLimit: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

async function requireAdminSession() {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.email !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { session };
}

export async function GET() {
  const adminCheck = await requireAdminSession();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("campaign_codes")
      .select("id, code, description, duration_days, usage_limit, usage_count, valid_from, valid_to, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campaigns: data ?? [] });
  } catch (error) {
    console.error("fetch campaigns failed", error);
    return NextResponse.json({ error: "Failed to load campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminCheck = await requireAdminSession();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const payload = createCampaignSchema.parse(await request.json());
    const code = normalizeCode(payload.code);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("campaign_codes")
      .insert({
        code,
        description: payload.description ?? null,
        duration_days: payload.durationDays,
        usage_limit: payload.usageLimit ?? null,
        valid_from: payload.validFrom ?? null,
        valid_to: payload.validTo ?? null,
        is_active: payload.isActive ?? true,
      } as never)
      .select()
      .single();

    if (error) {
      if (error.message?.includes("duplicate")) {
        return NextResponse.json({ error: "同じコードが既に存在します" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ campaign: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    console.error("create campaign failed", error);
    return NextResponse.json({ error: "キャンペーンの作成に失敗しました" }, { status: 500 });
  }
}
