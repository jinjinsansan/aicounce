"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Activity, Users, MessageSquare, RefreshCw } from "lucide-react";

type RealtimeStats = {
  activeUsers: number;
  recentMessageCount: number;
  recentTeamMessageCount: number;
  totalUsers: number;
  activeUserList: Array<{ email: string; lastLoginAt: string }>;
};

export default function AdminRealtimePage() {
  const { session, loading } = useSupabase();
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStats = useCallback(async () => {
    if (!session) return;

    setFetching(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/realtime-stats", { cache: "no-store" });
      if (!response.ok) throw new Error("failed");
      const data = await response.json();
      setStats(data);
    } catch {
      setError("リアルタイム統計を取得できませんでした。");
    } finally {
      setFetching(false);
    }
  }, [session]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadStats();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadStats]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-500">
        セッション確認中...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-500">
        管理画面にアクセスするにはログインが必要です。
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
              Real-time
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">リアルタイム統計</h2>
          <p className="mt-1 text-sm text-slate-500">
            過去5分間のアクティブユーザーとメッセージ数を表示しています。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4"
            />
            自動更新 (10秒)
          </label>
          <button
            type="button"
            onClick={loadStats}
            disabled={fetching}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="アクティブユーザー"
          value={stats?.activeUsers ?? 0}
          suffix="人"
          color="bg-emerald-500"
          loading={fetching && !stats}
        />
        <StatCard
          icon={MessageSquare}
          label="直近メッセージ"
          value={stats?.recentMessageCount ?? 0}
          suffix="件"
          color="bg-blue-500"
          loading={fetching && !stats}
        />
        <StatCard
          icon={MessageSquare}
          label="チームチャット"
          value={stats?.recentTeamMessageCount ?? 0}
          suffix="件"
          color="bg-purple-500"
          loading={fetching && !stats}
        />
        <StatCard
          icon={Users}
          label="総登録ユーザー"
          value={stats?.totalUsers ?? 0}
          suffix="人"
          color="bg-slate-500"
          loading={fetching && !stats}
        />
      </div>

      {stats && stats.activeUserList.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            アクティブユーザー一覧
          </h3>
          <p className="text-xs text-slate-500">過去5分以内にログインしたユーザー</p>
          <div className="mt-4 space-y-2">
            {stats.activeUserList.map((user, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-900">{user.email}</span>
                <span className="text-xs text-slate-500">
                  {new Date(user.lastLoginAt).toLocaleTimeString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`rounded-2xl ${color} p-3 text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        {loading && (
          <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {label}
        </p>
        {loading ? (
          <div className="mt-2 h-10 w-20 animate-pulse rounded bg-slate-200" />
        ) : (
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>
          </p>
        )}
      </div>
    </div>
  );
}
