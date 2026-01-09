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
  campaign: {
    expires_at: string;
    campaign: {
      code: string;
      description?: string | null;
    } | null;
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
  const [campaignInput, setCampaignInput] = useState("");
  const [campaignStatus, setCampaignStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<"unread" | "all">("unread");
  const [notificationUpdating, setNotificationUpdating] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

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

  const handleRedeemCampaign = async () => {
    if (!campaignInput.trim()) {
      setCampaignStatus({ type: "error", message: "コードを入力してください" });
      return;
    }
    setCampaignLoading(true);
    setCampaignStatus(null);
    try {
      const response = await fetch("/api/account/redeem-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: campaignInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCampaignStatus({ type: "error", message: data.error ?? "適用に失敗しました" });
        return;
      }
      setCampaignInput("");
      setCampaignStatus({ type: "success", message: "キャンペーンを適用しました" });
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              campaign: {
                expires_at: data.expiresAt,
                campaign: { code: data.code, description: null },
              },
              access: {
                ...prev.access,
                campaignAccess: { code: data.code, expiresAt: data.expiresAt },
                canUseIndividual: true,
                canUseTeam: true,
              },
            }
          : prev,
      );
    } catch (err) {
      console.error(err);
      setCampaignStatus({ type: "error", message: "キャンペーン適用に失敗しました" });
    } finally {
      setCampaignLoading(false);
    }
  };

  const handleNotificationsUpdated = (next: OverviewResponse["notifications"]) => {
    setOverview((prev) => (prev ? { ...prev, notifications: next } : prev));
  };

  const markNotificationsAsRead = async ({ ids, markAll = false }: { ids?: string[]; markAll?: boolean }) => {
    if (notificationUpdating) return;
    if (!markAll && (!ids || ids.length === 0)) return;

    setNotificationUpdating(true);
    setNotificationMessage(null);

    try {
      const response = await fetch("/api/account/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(markAll ? { all: true } : { ids }),
      });
      if (!response.ok) {
        throw new Error("failed");
      }
      const data = (await response.json()) as { notifications?: OverviewResponse["notifications"] };
      handleNotificationsUpdated(data.notifications ?? []);
      setNotificationMessage("既読にしました");
    } catch (err) {
      console.error(err);
      setNotificationMessage("既読処理に失敗しました");
    } finally {
      setNotificationUpdating(false);
      setTimeout(() => setNotificationMessage(null), 4000);
    }
  };

  const notifications = overview?.notifications ?? [];
  const unreadNotifications = notifications.filter((notification) => !notification.read_at);
  const visibleNotifications = notificationFilter === "unread" ? unreadNotifications : notifications;

  useEffect(() => {
    if (!overview) return;
    if (notificationFilter === "unread" && unreadNotifications.length === 0) {
      setNotificationFilter("all");
    }
  }, [overview, notificationFilter, unreadNotifications.length]);

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
                price={500}
                description="個別カウンセリングチャット"
                active={currentPlan === "basic"}
              />
              <PlanCard
                plan="premium"
                title="プレミアムプラン"
                price={1500}
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

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
              <h3 className="text-base font-semibold text-slate-900">PayPalサブスクリプションの解約</h3>
              <p className="mt-2">
                定期支払いはPayPalアカウント側でいつでもキャンセルできます。以下の手順をご確認ください。
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>PayPalにログインし、「設定 &gt; 支払い &gt; 自動支払いの管理」を開く。</li>
                <li>「メンタルAIチーム」または「NAMIDA Support Association」を選択。</li>
                <li>「キャンセル」ボタンを押して確認する。</li>
              </ol>
              <a
                href="https://www.paypal.com/myaccount/autopay/"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                PayPalで解約手続きを行う
              </a>
              <p className="mt-3 text-xs text-slate-500">
                手順が不明な場合は <Link href="mailto:info@namisapo.com" className="underline">info@namisapo.com</Link> までご連絡ください。
              </p>
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
                  href="https://line.me/R/ti/p/@701wsyqr"
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
              <h2 className="text-xl font-bold text-slate-900">キャンペーンコード</h2>
              <p className="mt-1 text-sm text-slate-500">
                管理者から案内されたコードを入力すると、指定期間のプレミアムアクセスが付与されます。
              </p>
              {overview.access.campaignAccess && (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold">
                    適用中: {overview.access.campaignAccess.code}
                  </p>
                  <p>終了日: {formatDateTime(overview.access.campaignAccess.expiresAt)}</p>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="text"
                  value={campaignInput}
                  onChange={(event) => setCampaignInput(event.target.value)}
                  placeholder="カタカナコード"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleRedeemCampaign}
                  disabled={campaignLoading}
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
                >
                  {campaignLoading ? "適用中..." : "キャンペーンを適用"}
                </button>
                {campaignStatus && (
                  <p
                    className={`text-sm ${campaignStatus.type === "success" ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {campaignStatus.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">通知ボックス</h2>
                  <p className="text-sm text-slate-500">
                    未読 {unreadNotifications.length} 件 / 合計 {overview.notifications.length} 件
                  </p>
                </div>
                <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-500">
                  {[
                    { value: "unread", label: "未読" },
                    { value: "all", label: "すべて" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNotificationFilter(value as "unread" | "all")}
                      className={`rounded-full px-4 py-1 transition ${
                        notificationFilter === value ? "bg-slate-900 text-white" : "text-slate-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {notificationMessage && (
                <p className="mt-3 text-sm text-slate-500">{notificationMessage}</p>
              )}

              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => markNotificationsAsRead({ markAll: true })}
                  disabled={notificationUpdating}
                  className="mt-4 text-xs font-semibold text-blue-700 underline disabled:opacity-50"
                >
                  未読をすべて既読にする
                </button>
              )}

              <div className="mt-4 space-y-3">
                {visibleNotifications.length === 0 && (
                  <p className="text-sm text-slate-500">
                    {notificationFilter === "unread" ? "未読のお知らせはありません。" : "お知らせはありません。"}
                  </p>
                )}
                {visibleNotifications.map((notification) => {
                  const isUnread = !notification.read_at;
                  return (
                    <article
                      key={notification.id}
                      className={`rounded-2xl border px-4 py-3 ${
                        isUnread ? "border-blue-200 bg-white shadow-sm" : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {notification.title}
                            {isUnread && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                未読
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-600 whitespace-pre-line">{notification.body}</p>
                          <p className="text-xs text-slate-400">{formatDateTime(notification.sent_at)}</p>
                        </div>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markNotificationsAsRead({ ids: [notification.id] })}
                            disabled={notificationUpdating}
                            className="text-xs font-semibold text-blue-700 underline-offset-2 hover:underline disabled:opacity-50"
                          >
                            既読にする
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
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

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ja-JP");
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
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!paypalClientId) return;
    if (typeof window === "undefined") return;
    if (mountedRef.current) return;

    const renderButtons = () => {
      if (!containerRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[PayPal ${plan}] containerRef is null, retrying...`);
        }
        setTimeout(renderButtons, 100);
        return;
      }
      const paypalSdk = (window as PaypalWindow).paypal;
      if (!paypalSdk) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[PayPal ${plan}] SDK not loaded, retrying...`);
        }
        setTimeout(renderButtons, 100);
        return;
      }
      
      mountedRef.current = true;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PayPal ${plan}] Rendering button...`);
      }
      
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
          if (process.env.NODE_ENV === 'development') {
            console.error(`[PayPal ${plan}] Error:`, err);
          }
          setError("決済に失敗しました");
        },
      }).render(containerRef.current);
    };

    if (typeof window !== "undefined" && (window as PaypalWindow).paypal) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PayPal ${plan}] SDK already loaded, rendering immediately`);
      }
      renderButtons();
      return;
    }

    const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existingScript) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PayPal ${plan}] Script already exists, waiting for load...`);
      }
      const checkInterval = setInterval(() => {
        if ((window as PaypalWindow).paypal) {
          clearInterval(checkInterval);
          renderButtons();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[PayPal ${plan}] Loading SDK...`);
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=JPY`;
    script.async = true;
    script.onload = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PayPal ${plan}] SDK loaded`);
      }
      renderButtons();
    };
    script.onerror = () => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[PayPal ${plan}] Failed to load SDK`);
      }
      setError("PayPal SDKの読み込みに失敗しました");
    };
    document.body.appendChild(script);

    return () => {
      mountedRef.current = false;
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
