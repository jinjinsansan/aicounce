"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AccessState } from "@/lib/access-control";
import type { PlanSlug } from "@/lib/plans";

type OverviewResponse = {
  profile: {
    email: string;
    username: string | null;
    lastLoginAt: string;
  };
  subscription: {
    plan_id: PlanSlug;
    status: string;
    current_period_end: string | null;
  } | null;
  trial: {
    line_linked: boolean;
    trial_expires_at: string | null;
    trial_started_at: string | null;
  } | null;
  notifications: {
    id: string;
    title: string;
    body: string;
    sent_at: string;
    read_at: string | null;
  }[];
  access: AccessState;
};

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

type PaypalButtonOptions = {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: unknown) => void;
};

type PaypalSdk = {
  Buttons: (options: PaypalButtonOptions) => { render: (container: HTMLElement | null) => void };
};

type PaypalWindow = Window & {
  paypal?: PaypalSdk;
};

export default function AccountPage() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialState, setTrialState] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/account/overview", { cache: "no-store" });
        if (!response.ok) {
          if (response.status === 401) {
            if (!active) return;
            setError("ログインが必要です");
            setOverview(null);
            return;
          }
          throw new Error("failed");
        }
        const data = (await response.json()) as OverviewResponse;
        if (!active) return;
        setOverview(data);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError("情報を取得できませんでした");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleLinkLine = async () => {
    setTrialState("loading");
    setError(null);
    try {
      const response = await fetch("/api/trial/line", { method: "POST" });
      if (!response.ok) {
        throw new Error("failed");
      }
      const data = await response.json();
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              trial: {
                line_linked: true,
                trial_expires_at: data.trialExpiresAt,
                trial_started_at: new Date().toISOString(),
              },
              access: { ...prev.access, onTrial: true, canUseIndividual: true, canUseTeam: true },
            }
          : prev,
      );
      setTrialState("success");
    } catch {
      setError("LINE連携に失敗しました");
      setTrialState("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        読み込み中...
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center text-slate-600">
        <p>{error}</p>
        <Link href="/" className="rounded-full border border-slate-300 px-4 py-2">
          ホームに戻る
        </Link>
        {error === "ログインが必要です" && (
          <Link href="/login" className="rounded-full border border-slate-900 px-4 py-2 text-slate-900">
            ログインする
          </Link>
        )}
      </div>
    );
  }

  if (!overview) return null;

  const currentPlan = overview.subscription?.plan_id ?? "none";
  const trialEnds = overview.trial?.trial_expires_at
    ? new Date(overview.trial.trial_expires_at).toLocaleString("ja-JP")
    : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Account
          </p>
          <h1 className="text-3xl font-black text-slate-900">マイページ</h1>
          <p className="text-slate-600">プラン管理、LINE連携、最新のお知らせを確認できます。</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">プランとトライアル</h2>
            <p className="mt-1 text-sm text-slate-500">ベーシックとプレミアムを切り替えられます。</p>

            <div className="mt-6 space-y-4">
              <PlanCard
                plan="basic"
                title="ベーシックプラン"
                price={1980}
                description="個別カウンセリングチャット"
                active={currentPlan === "basic"}
              />
              <PlanCard
                plan="premium"
                title="プレミアムプラン"
                price={3980}
                description="個別 + チームカウンセリング"
                active={currentPlan === "premium"}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p>
                現在の状態: {overview.access.onTrial ? "無料トライアル中" : currentPlan === "none" ? "未契約" : `契約中 (${currentPlan})`}
              </p>
              {trialEnds && <p>トライアル終了日: {trialEnds}</p>}
              {overview.subscription?.current_period_end && (
                <p>
                  次回請求予定: {new Date(overview.subscription.current_period_end).toLocaleDateString("ja-JP")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">公式LINE連携</h2>
              <p className="mt-1 text-sm text-slate-500">
                公式LINEを追加すると7日間の無料トライアルが開始されます。
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="https://line.me/R/ti/p/@mentalai"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-500/30"
                >
                  LINE公式アカウントを追加
                </a>
                <button
                  type="button"
                  onClick={handleLinkLine}
                  disabled={trialState === "loading"}
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700"
                >
                  {overview.trial?.line_linked ? "連携済み" : trialState === "loading" ? "確認中..." : "連携を確認する"}
                </button>
                {trialState === "success" && (
                  <p className="text-xs text-emerald-600">トライアルを開始しました！</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">通知ボックス</h2>
              <div className="mt-4 space-y-3">
                {overview.notifications.length === 0 && (
                  <p className="text-sm text-slate-500">お知らせはありません。</p>
                )}
                {overview.notifications.map((notification) => (
                  <article key={notification.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                    <p className="text-sm text-slate-600">{notification.body}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(notification.sent_at).toLocaleString("ja-JP")}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">アカウント情報</h2>
              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <dt>メールアドレス</dt>
                  <dd className="font-semibold text-slate-900">{overview.profile.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>最終ログイン</dt>
                  <dd>{new Date(overview.profile.lastLoginAt).toLocaleString("ja-JP")}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  title,
  description,
  price,
  active,
}: {
  plan: PlanSlug;
  title: string;
  description: string;
  price: number;
  active: boolean;
}) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
        {plan === "basic" ? "Basic" : "Premium"}
      </p>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-black">¥{price.toLocaleString()}</span>
        <span className="text-sm">/月</span>
      </div>
      <p className="mt-1 text-sm opacity-80">{description}</p>
      {!active && paypalClientId && <PayPalButton plan={plan} />}
      {active && <p className="mt-3 text-sm text-emerald-200">契約中</p>}
    </div>
  );
}

function PayPalButton({ plan }: { plan: PlanSlug }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!paypalClientId) return;
    if (typeof window === "undefined") return;

    const renderButtons = () => {
      if (!containerRef.current) return;
      const paypalSdk = (window as PaypalWindow).paypal;
      if (!paypalSdk) return;
      paypalSdk.Buttons({
        createOrder: async () => {
          const response = await fetch("/api/payments/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "failed");
          return data.orderId;
        },
        onApprove: async (data: { orderID: string }) => {
          const response = await fetch("/api/payments/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID, plan }),
          });
          if (!response.ok) {
            const payload = await response.json();
            throw new Error(payload.error ?? "capture failed");
          }
          setReady(true);
          window.location.reload();
        },
        onError: (err: unknown) => {
          console.error(err);
          setError("決済に失敗しました");
        },
      }).render(containerRef.current);
    };

    if (typeof window !== "undefined" && (window as PaypalWindow).paypal) {
      renderButtons();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=JPY`;
    script.async = true;
    script.onload = () => renderButtons();
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [plan]);

  return (
    <div className="mt-3 space-y-2">
      <div ref={containerRef} />
      {ready && <p className="text-xs text-emerald-500">決済が完了しました。</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
