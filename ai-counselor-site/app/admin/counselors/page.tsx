"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type CounselorStat = {
  id: string;
  name: string;
  specialty: string;
  iconUrl: string;
  ragEnabled: boolean;
  sessionCount: number;
  teamSessionCount: number;
  totalSessionCount: number;
};

type Filter = "all" | "rag" | "nonRag";

export default function AdminCounselorsPage() {
  const { session, loading } = useSupabase();
  const [stats, setStats] = useState<CounselorStat[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    let mounted = true;
    fetch("/api/admin/counselor-stats", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        const data = await response.json();
        if (!mounted) return;
        setStats(data.stats);
      })
      .catch(() => {
        if (!mounted) return;
        setError("カウンセラー統計を取得できませんでした。");
      })
      .finally(() => mounted && setFetching(false));

    return () => {
      mounted = false;
    };
  }, [session]);

  const filteredStats = useMemo(() => {
    if (filter === "rag") {
      return stats.filter((stat) => stat.ragEnabled);
    }
    if (filter === "nonRag") {
      return stats.filter((stat) => !stat.ragEnabled);
    }
    return stats;
  }, [stats, filter]);

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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            Counselor Statistics
          </p>
          <h2 className="text-2xl font-bold text-slate-900">カウンセラー別統計</h2>
          <p className="text-sm text-slate-500">
            チャット作成回数の多い順に表示しています。TOPページのカウンセラー一覧と同期しています。
          </p>
        </div>
        <div className="flex gap-2 rounded-full bg-white/80 p-1 text-sm font-semibold text-slate-600 shadow-inner">
          {[
            { value: "all", label: "すべて" },
            { value: "rag", label: "RAG対応" },
            { value: "nonRag", label: "RAG未設定" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as Filter)}
              className={`rounded-full px-4 py-1 ${
                filter === value
                  ? "bg-blue-600 text-white"
                  : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(fetching
          ? Array.from({ length: 6 }, () => null)
          : filteredStats
        ).map((stat, idx) => (
          <StatCard
            key={stat?.id ?? `skeleton-${idx}`}
            stat={stat ?? undefined}
            loading={fetching}
            rank={idx + 1}
          />
        ))}
      </div>
    </section>
  );
}

function StatCard({
  stat,
  loading,
  rank,
}: {
  stat?: CounselorStat;
  loading: boolean;
  rank: number;
}) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-sm animate-pulse">
        <div className="h-16 w-16 rounded-2xl bg-slate-200" />
        <div className="mt-4 h-5 w-32 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-24 rounded bg-slate-200" />
      </div>
    );
  }

  if (!stat) return null;

  const rankColor =
    rank === 1
      ? "bg-amber-100 text-amber-700"
      : rank === 2
        ? "bg-slate-200 text-slate-700"
        : rank === 3
          ? "bg-orange-100 text-orange-700"
          : "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {stat.iconUrl ? (
            <Image
              src={stat.iconUrl}
              alt={stat.name}
              fill
              className="object-contain"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-bold text-slate-400">
              ?
            </div>
          )}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${rankColor}`}>
          #{rank}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-bold text-slate-900">{stat.name}</h3>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {stat.specialty}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500">合計セッション数</p>
            <p className="text-3xl font-bold text-slate-900">{stat.totalSessionCount.toLocaleString()}</p>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              stat.ragEnabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {stat.ragEnabled ? "RAG" : "非RAG"}
          </span>
        </div>
        <div className="flex gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400">個別: </span>
            <span className="font-semibold">{stat.sessionCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400">チーム: </span>
            <span className="font-semibold">{stat.teamSessionCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
