"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Counselor } from "@/types";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { loadCounselors } from "@/lib/client-counselors";

type Filter = "all" | "rag" | "nonRag";

export default function AdminCounselorsPage() {
  const { session, loading } = useSupabase();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    let mounted = true;
    loadCounselors()
      .then((data) => {
        if (!mounted) return;
        setCounselors(data);
      })
      .catch(() => {
        if (!mounted) return;
        setError("カウンセラー情報を取得できませんでした。");
      })
      .finally(() => mounted && setFetching(false));

    return () => {
      mounted = false;
    };
  }, [session]);

  const filteredCounselors = useMemo(() => {
    if (filter === "rag") {
      return counselors.filter((counselor) => counselor.ragEnabled);
    }
    if (filter === "nonRag") {
      return counselors.filter((counselor) => !counselor.ragEnabled);
    }
    return counselors;
  }, [counselors, filter]);

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
            Counselors
          </p>
          <h2 className="text-2xl font-bold text-slate-900">カウンセラー設定</h2>
          <p className="text-sm text-slate-500">
            RAG対応状況や使用モデル、プロンプトをレビューし、必要に応じて更新してください。
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

      <div className="grid gap-4 md:grid-cols-2">
        {(fetching
          ? Array.from({ length: 4 }, () => null)
          : filteredCounselors
        ).map((counselor, idx) => (
          <CounselorCard
            key={counselor?.id ?? `skeleton-${idx}`}
            counselor={counselor ?? undefined}
            loading={fetching}
          />
        ))}
      </div>
    </section>
  );
}

function CounselorCard({
  counselor,
  loading,
}: {
  counselor?: Counselor;
  loading: boolean;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (label: string, value?: string) => {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (error) {
      console.error("Clipboard copy failed", error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white/70 p-5 shadow-sm animate-pulse">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-4 w-32 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-24 rounded bg-slate-200" />
      </div>
    );
  }

  if (!counselor) return null;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            {counselor.specialty}
          </p>
          <h3 className="text-xl font-bold text-slate-900">{counselor.name}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            counselor.ragEnabled
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {counselor.ragEnabled ? "RAG有効" : "RAG未設定"}
        </span>
      </div>
      <dl className="mt-4 space-y-2 text-sm text-slate-600">
        <InfoRow label="モデル">
          {counselor.modelType} / {counselor.modelName}
        </InfoRow>
        <InfoRow label="システムプロンプト">
          <span className="line-clamp-2 text-slate-500">
            {counselor.systemPrompt ?? "未設定"}
          </span>
        </InfoRow>
        <InfoRow label="カウンセラーID">{counselor.id}</InfoRow>
      </dl>
      <div className="mt-4 flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => handleCopy("id", counselor.id)}
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-300"
        >
          {copiedField === "id" ? "コピー済み" : "IDをコピー"}
        </button>
        <button
          type="button"
          onClick={() => handleCopy("prompt", counselor.systemPrompt)}
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-300"
        >
          {copiedField === "prompt" ? "コピー済み" : "プロンプトをコピー"}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </dt>
      <dd className="flex-1 text-right text-slate-700">{children}</dd>
    </div>
  );
}
