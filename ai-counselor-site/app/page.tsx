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
    <div className="h-[400px] rounded-[32px] bg-white/40 shadow-inner animate-pulse" />
  ),
});

const ProblemSolutionSection = dynamic(
  () => import("@/components/ProblemSolutionSection")
);

const PricingSection = dynamic(() => import("@/components/PricingSection"));

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
    <div className="min-h-screen bg-[#fdfdfd]">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Hero Area */}
        <HeroSection />

        {/* Introduction / Problem & Solution */}
        <div id="about">
          <ProblemSolutionSection />
        </div>

        {/* Counselors Grid */}
        <section id="counselors" className="scroll-mt-24">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              専門分野から選ぶ
            </h2>
            <p className="mt-4 text-slate-600">
              あなたの悩みや目的に最適なパートナーが見つかります
            </p>
          </div>

          {loading ? (
            <div className="rounded-[32px] bg-slate-50 p-10">
              <LoadingState />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

        {/* Pricing & CTA */}
        <PricingSection />

        {/* FAQ (Keeping as it's useful) */}
        <FAQSection />
      </div>
    </div>
  );
}
