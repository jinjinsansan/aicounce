import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase } from "@/lib/supabase-server";
import { assertPlanSlug, PLAN_DEFINITIONS, monthsFromNow } from "@/lib/plans";
import { capturePayPalOrder } from "@/lib/paypal";

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
    const { orderId, plan } = await request.json();
    if (!orderId || !assertPlanSlug(plan)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const captureResult = await capturePayPalOrder(orderId);
    if (captureResult?.status !== "COMPLETED") {
      return NextResponse.json({ error: "Capture failed" }, { status: 400 });
    }

    const purchaseUnit = captureResult?.purchase_units?.[0];
    const customId = purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id;
    if (customId) {
      const [, planFromOrder] = String(customId).split(":");
      if (planFromOrder && assertPlanSlug(planFromOrder) && planFromOrder !== plan) {
        return NextResponse.json({ error: "Plan mismatch" }, { status: 400 });
      }
    }

    const adminSupabase = getServiceSupabase();
    await adminSupabase
      .from("user_subscriptions")
      .update({ status: "canceled" })
      .eq("user_id", session.user.id)
      .neq("status", "canceled");

    const definition = PLAN_DEFINITIONS[plan];
    await adminSupabase.from("user_subscriptions").insert({
      user_id: session.user.id,
      plan_id: plan,
      status: "active",
      paypal_order_id: orderId,
      current_period_end: monthsFromNow(1),
    });

    return NextResponse.json({ success: true, plan: definition });
  } catch (error) {
    console.error("paypal capture error", error);
    return NextResponse.json({ error: "Failed to capture order" }, { status: 500 });
  }
}
