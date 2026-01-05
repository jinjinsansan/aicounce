"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Counselor } from "@/types";
import { useResolvedParams } from "@/hooks/useResolvedParams";
import { loadCounselorById } from "@/lib/client-counselors";
import MichelleDetailPage from "@/components/MichelleDetailPage";
import SatoDetailPage from "@/components/SatoDetailPage";
import AdamDetailPage from "@/components/AdamDetailPage";
import GeminiDetailPage from "@/components/GeminiDetailPage";
import ClaudeDetailPage from "@/components/ClaudeDetailPage";
import DeepDetailPage from "@/components/DeepDetailPage";
import NazareDetailPage from "@/components/NazareDetailPage";

const FeaturesSection = dynamic(() => import("@/components/FeaturesSection"), {
  loading: () => (
    <section className="h-64 rounded-[32px] bg-white/60 p-10 shadow-inner">
      <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100" />
    </section>
  ),
});

function StandardCounselorDetail({ counselorId }: { counselorId: string }) {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    loadCounselorById(counselorId)
      .then((data) => {
        if (!mounted) return;
        setCounselor(data);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [counselorId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        読み込み中...
      </div>
    );
  }

  if (!counselor) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        カウンセラーが見つかりませんでした。
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
        >
          ← 一覧に戻る
        </button>

        <section className="grid gap-8 rounded-[32px] bg-white/90 p-10 shadow-xl lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                {counselor.specialty}
              </p>
              <h1 className="mt-2 text-4xl font-bold text-slate-900">
                {counselor.name}
              </h1>
              <p className="mt-4 text-slate-600">{counselor.description}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">相談スタイル</p>
              <p className="mt-2">
                対話テンポやトーンを調整しながら、感じていることを安全に言葉にできるようサポートします。
                重要なポイントはメモとしてまとめ、次のステップへ自然につなげます。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {counselor.tags?.map((tag) => (
                <span
                  key={`${counselor.id}-${tag}`}
                  className="rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.push(`/counselor/chat/${counselor.id}`)}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-blue-500"
            >
              このカウンセラーと相談を始める
            </button>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              プロファイル
            </p>
            <dl className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <dt className="font-semibold text-slate-400">モデルタイプ</dt>
                <dd className="text-base text-slate-900">{counselor.modelType}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-400">モデル名称</dt>
                <dd className="text-base text-slate-900">{counselor.modelName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-400">RAG</dt>
                <dd className="text-base text-slate-900">
                  {counselor.ragEnabled ? "有効" : "未設定"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <FeaturesSection />
      </div>
    </div>
  );
}

export default function CounselorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = useResolvedParams(params);
  const counselorId = resolvedParams?.id;

  if (!counselorId) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        読み込み中...
      </div>
    );
  }

  if (counselorId === "michele") {
    return <MichelleDetailPage />;
  }

  if (counselorId === "sato") {
    return <SatoDetailPage />;
  }

  if (counselorId === "nazare") {
    return <NazareDetailPage />;
  }

  if (counselorId === "adam") {
    return <AdamDetailPage />;
  }

  if (counselorId === "gemini") {
    return <GeminiDetailPage />;
  }

  if (counselorId === "claude") {
    return <ClaudeDetailPage />;
  }

  if (counselorId === "deep") {
    return <DeepDetailPage />;
  }

  return <StandardCounselorDetail counselorId={counselorId} />;
}
