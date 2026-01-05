import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase } from "@/lib/supabase-server";

type CampaignCodeRow = {
  id: string;
  duration_days: number;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
};

const bodySchema = z.object({
  code: z.string().min(2).max(32),
});

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = bodySchema.parse(await request.json());
    const normalized = normalizeCode(code);
    const adminSupabase = getServiceSupabase();

    const { data: campaign, error } = await adminSupabase
      .from("campaign_codes")
      .select("id, duration_days, usage_limit, usage_count, valid_from, valid_to, is_active")
      .eq("code", normalized)
      .single();

    const campaignRecord = campaign as CampaignCodeRow | null;

    if (error || !campaignRecord) {
      return NextResponse.json({ error: "該当するキャンペーンコードが見つかりません" }, { status: 404 });
    }

    const now = new Date();
    if (!campaignRecord.is_active) {
      return NextResponse.json({ error: "このキャンペーンコードは無効です" }, { status: 400 });
    }
    if (campaignRecord.valid_from && new Date(campaignRecord.valid_from) > now) {
      return NextResponse.json({ error: "このコードはまだ利用できません" }, { status: 400 });
    }
    if (campaignRecord.valid_to && new Date(campaignRecord.valid_to) < now) {
      return NextResponse.json({ error: "このコードの有効期限が切れました" }, { status: 400 });
    }
    if (campaignRecord.usage_limit && campaignRecord.usage_count >= campaignRecord.usage_limit) {
      return NextResponse.json({ error: "このコードの利用上限に達しました" }, { status: 400 });
    }

    const { data: existing } = await adminSupabase
      .from("campaign_redemptions")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("campaign_code_id", campaignRecord.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "このコードは既に利用済みです" }, { status: 409 });
    }

    const expiresAt = addDays(now, campaignRecord.duration_days).toISOString();

    const { error: insertError } = await adminSupabase
      .from("campaign_redemptions")
      .insert({
        user_id: session.user.id,
        campaign_code_id: campaignRecord.id,
        expires_at: expiresAt,
      } as never);

    if (insertError) throw insertError;

    const { error: updateError } = await adminSupabase
      .from("campaign_codes")
      .update({ usage_count: campaignRecord.usage_count + 1 } as never)
      .eq("id", campaignRecord.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, expiresAt, code: normalized });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "無効な入力です" }, { status: 400 });
    }
    console.error("redeem campaign failed", error);
    return NextResponse.json({ error: "キャンペーンの適用に失敗しました" }, { status: 500 });
  }
}
