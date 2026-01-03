"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import CounselorCard from "@/components/CounselorCard";
import { LoadingState } from "@/components/LoadingState";
import type { Counselor } from "@/types";
import { loadCounselors } from "@/lib/client-counselors";

const HeroSection = dynamic(() => import("@/components/HeroSection"), {
  loading: () => (
    <div className="h-[320px] rounded-[32px] bg-white/40 shadow-inner animate-pulse" />
  ),
});

const FeaturesSection = dynamic(
  () => import("@/components/FeaturesSection"),
  { ssr: false },
);

const FAQSection = dynamic(() => import("@/components/FAQSection"), {
  ssr: false,
});

export default function HomePage() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    loadCounselors()
      .then((data) => {
        if (!mounted) return;
        setCounselors(data);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <HeroSection />

        <section id="counselors" className="space-y-8 rounded-[32px] bg-white/90 p-10 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                Counselors
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                目的に合わせてAIカウンセラーを選択
              </h2>
              <p className="text-sm text-slate-600">
                RAG対応済みの専門カウンセラーから汎用アシスタントまで網羅しています。
              </p>
            </div>
            <div className="text-sm text-slate-500">
              {counselors.length} counselors available
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {counselors.map((counselor) => (
                <CounselorCard
                  key={counselor.id}
                  counselor={counselor}
                  onSelect={(id) => router.push(`/counselor/${id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <FeaturesSection />
        <FAQSection />
      </div>
    </div>
  );
}
