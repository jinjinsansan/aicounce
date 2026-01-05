"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  AdminMetrics,
  CounselorInsight,
  UsagePoint,
} from "@/lib/admin-metrics";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type FetchState = "idle" | "error";
const ADMIN_EMAIL = "goldbenchan@gmail.com";

type CampaignRecord = {
  id: string;
  code: string;
  description: string | null;
  duration_days: number;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  created_at: string | null;
};

export default function AdminDashboardPage() {
  const { session, loading } = useSupabase();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setCampaignLoading(true);
    setCampaignError(null);
    try {
      const response = await fetch("/api/admin/campaigns", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("failed");
      }
      const data = await response.json();
      setCampaigns(data.campaigns ?? []);
    } catch (error) {
      console.error("campaign fetch failed", error);
      setCampaignError("キャンペーン情報を取得できませんでした");
    } finally {
      setCampaignLoading(false);
    }
  }, []);

  const handleCreateCampaign = useCallback(
    async (payload: {
      code: string;
      durationDays: number;
      description?: string;
      usageLimit?: number;
      validFrom?: string;
      validTo?: string;
      isActive: boolean;
    }) => {
      setCampaignLoading(true);
      setCampaignError(null);
      try {
        const response = await fetch("/api/admin/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          const message = data.error ?? "キャンペーンの作成に失敗しました";
          setCampaignError(message);
          return { success: false, error: message };
        }
        setCampaigns((prev) => [data.campaign, ...prev]);
        return { success: true };
      } catch (error) {
        console.error("campaign create failed", error);
        const message = "キャンペーンの作成に失敗しました";
        setCampaignError(message);
        return { success: false, error: message };
      } finally {
        setCampaignLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    fetch("/api/admin/metrics", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load metrics");
        }
        return (await response.json()) as AdminMetrics;
      })
      .then((data) => {
        setMetrics(data);
        setFetchState("idle");
      })
      .catch(() => {
        setFetchState("error");
      });
  }, [session]);

  useEffect(() => {
    if (!session || session.user.email !== ADMIN_EMAIL) return;
    loadCampaigns();
  }, [session, loadCampaigns]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        セッション確認中...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-slate-600">
        <p>管理ダッシュボードにアクセスするにはログインが必要です。</p>
        <Link
          href="/login"
          className="rounded-full border border-slate-200 px-4 py-2 text-slate-900"
        >
          ログインページへ
        </Link>
      </div>
    );
  }

  const isAdmin = session.user.email === ADMIN_EMAIL;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-slate-600">
        <p>このダッシュボードにアクセスする権限がありません。</p>
        <Link
          href="/"
          className="rounded-full border border-slate-200 px-4 py-2 text-slate-900"
        >
          ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {fetchState === "error" && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          指標を取得できませんでした。時間をおいて再度お試しください。
        </div>
      )}

      <SummaryGrid metrics={metrics?.summary} loading={!metrics && fetchState !== "error"} />
      <UsagePanel usage={metrics?.usage ?? []} loading={!metrics && fetchState !== "error"} />
      <CounselorTable counselors={metrics?.counselors ?? []} loading={!metrics && fetchState !== "error"} />
      <CampaignManager
        campaigns={campaigns}
        loading={campaignLoading}
        error={campaignError}
        onCreate={handleCreateCampaign}
      />
    </div>
  );
}

function SummaryGrid({
  metrics,
  loading,
}: {
  metrics?: AdminMetrics["summary"];
  loading: boolean;
}) {
  const items = [
    {
      label: "登録カウンセラー",
      value: metrics?.counselorCount ?? "--",
      suffix: "名",
    },
    {
      label: "アクティブセッション(7d)",
      value: metrics?.activeSessions ?? "--",
      suffix: "件",
    },
    {
      label: "RAGカバレッジ",
      value: metrics ? `${metrics.ragCoverage}%` : "--",
    },
    {
      label: "平均応答レイテンシ",
      value: metrics ? `${metrics.averageLatencyMs}ms` : "--",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {item.label}
          </p>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {loading ? "--" : item.value}
            {!loading && item.suffix ? (
              <span className="ml-1 text-sm font-medium text-slate-400">
                {item.suffix}
              </span>
            ) : null}
          </p>
        </div>
      ))}
    </section>
  );
}

function UsagePanel({
  usage,
  loading,
}: {
  usage: UsagePoint[];
  loading: boolean;
}) {
  const rows = loading
    ? Array.from({ length: 5 }, () => ({
        date: "",
        sessions: 0,
        ragUsage: 40,
      }))
    : usage;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            運用トレンド
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            セッション推移 (過去7日)
          </h2>
        </div>
        <p className="text-sm text-slate-500">RAG使用率は棒グラフで表示</p>
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((point, idx) => (
          <div key={idx} className="space-y-2 rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{loading ? "---" : point.date}</span>
              <span>
                {loading ? "--" : `${point.sessions} sessions`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: loading ? "40%" : `${Math.min(point.ragUsage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CounselorTable({
  counselors,
  loading,
}: {
  counselors: CounselorInsight[];
  loading: boolean;
}) {
  const rows = loading
    ? Array.from({ length: 4 }, (_, idx) => ({
        id: `skeleton-${idx}`,
        name: "",
        specialty: "",
        ragEnabled: true,
        conversations: 0,
        satisfaction: 0,
        avgResponseMs: 0,
      }))
    : counselors;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            Counselor Health
          </p>
          <h2 className="text-2xl font-bold text-slate-900">カウンセラー別指標</h2>
        </div>
        <p className="text-sm text-slate-500">
          RAG有効化状況、満足度、平均応答時間などを確認
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead>
            <tr className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <th className="px-3 py-2 font-semibold">カウンセラー</th>
              <th className="px-3 py-2 font-semibold">専門領域</th>
              <th className="px-3 py-2 font-semibold">RAG</th>
              <th className="px-3 py-2 font-semibold">相談件数</th>
              <th className="px-3 py-2 font-semibold">満足度</th>
              <th className="px-3 py-2 font-semibold">平均応答</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx} className="border-t border-slate-100">
                <td className="px-3 py-4 font-semibold text-slate-900">
                  {loading ? "---" : row.name}
                </td>
                <td className="px-3 py-4">{loading ? "---" : row.specialty}</td>
                <td className="px-3 py-4">
                  {loading ? "--" : row.ragEnabled ? "有効" : "未設定"}
                </td>
                <td className="px-3 py-4">
                  {loading
                    ? "--"
                    : `${row.conversations.toLocaleString()}件`}
                </td>
                <td className="px-3 py-4">
                  {loading ? "--" : `${row.satisfaction}%`}
                </td>
                <td className="px-3 py-4">
                  {loading ? "--" : `${row.avgResponseMs}ms`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type CampaignManagerProps = {
  campaigns: CampaignRecord[];
  loading: boolean;
  error: string | null;
  onCreate: (payload: {
    code: string;
    durationDays: number;
    description?: string;
    usageLimit?: number;
    validFrom?: string;
    validTo?: string;
    isActive: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
};

function CampaignManager({ campaigns, loading, error, onCreate }: CampaignManagerProps) {
  const [code, setCode] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [description, setDescription] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setStatus({ type: "error", message: "コードを入力してください" });
      return;
    }
    setStatus(null);
    const payload = {
      code,
      durationDays,
      description: description.trim() ? description.trim() : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
      validTo: validTo ? new Date(validTo).toISOString() : undefined,
      isActive,
    };
    const result = await onCreate(payload);
    if (result.success) {
      setCode("");
      setDescription("");
      setUsageLimit("");
      setValidFrom("");
      setValidTo("");
      setDurationDays(30);
      setIsActive(true);
      setStatus({ type: "success", message: "キャンペーンを作成しました" });
    } else {
      setStatus({ type: "error", message: result.error ?? "作成に失敗しました" });
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">キャンペーン管理</p>
        <h2 className="text-2xl font-bold text-slate-900">キャンペーンコードの発行</h2>
        <p className="text-sm text-slate-500">
          コードと無料期間を設定して保存すると、マイページでユーザーが利用できるようになります。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">コード</label>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="例: ハルノキャンペーン"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">無料期間(日)</label>
          <input
            type="number"
            min={1}
            max={365}
            value={durationDays}
            onChange={(event) => setDurationDays(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">説明 (任意)</label>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">利用上限 (任意)</label>
          <input
            type="number"
            min={1}
            value={usageLimit}
            onChange={(event) => setUsageLimit(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">開始日 (任意)</label>
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(event) => setValidFrom(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">終了日 (任意)</label>
          <input
            type="datetime-local"
            value={validTo}
            onChange={(event) => setValidTo(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">有効化</label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-5 w-5"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            {loading ? "保存中..." : "キャンペーンを作成"}
          </button>
        </div>
        {status && (
          <div className={`text-sm ${status.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
            {status.message}
          </div>
        )}
        {error && <div className="text-sm text-red-500">{error}</div>}
      </form>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">発行済みキャンペーン</h3>
        {loading ? (
          <p className="text-sm text-slate-500">読み込み中...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-slate-500">まだキャンペーンコードはありません。</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-slate-900">{campaign.code}</p>
                    <p className="text-xs text-slate-500">
                      期間: {campaign.duration_days}日 / 利用 {campaign.usage_count}
                      {campaign.usage_limit ? ` / 上限 ${campaign.usage_limit}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${campaign.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                  >
                    {campaign.is_active ? "有効" : "停止中"}
                  </span>
                </div>
                {campaign.description && (
                  <p className="mt-2 text-sm text-slate-600">{campaign.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {campaign.valid_from ? `開始: ${new Date(campaign.valid_from).toLocaleString("ja-JP")}` : "開始: 指定なし"} / {campaign.valid_to ? `終了: ${new Date(campaign.valid_to).toLocaleString("ja-JP")}` : "終了: 指定なし"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
