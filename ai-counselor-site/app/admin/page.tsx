"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  AdminMetrics,
  CounselorInsight,
  UsagePoint,
} from "@/lib/admin-metrics";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type FetchState = "idle" | "error";

export default function AdminDashboardPage() {
  const { session, loading } = useSupabase();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");

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

  const isAdmin = session.user.email === "goldbenchan@gmail.com";
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
