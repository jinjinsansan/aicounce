import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { assertPlanSlug, PLAN_DEFINITIONS } from "@/lib/plans";
import { createPayPalOrder } from "@/lib/paypal";

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
    const { plan } = await request.json();
    if (!assertPlanSlug(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const definition = PLAN_DEFINITIONS[plan];
    const order = await createPayPalOrder(
      definition.priceYen,
      `${definition.label} (${definition.priceYen.toLocaleString()}円)`,
      `${session.user.id}:${plan}`,
    );

    const approval = Array.isArray(order.links)
      ? order.links.find((link: { rel: string }) => link.rel === "approve")
      : null;

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: approval?.href ?? null,
    });
  } catch (error) {
    console.error("paypal create order error", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
