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

const MultiCounselingSection = dynamic(
  () => import("@/components/MultiCounselingSection")
);

const PricingSection = dynamic(() => import("@/components/PricingSection"));

const FAQSection = dynamic(() => import("@/components/FAQSection"), {
  ssr: false,
});

const Footer = dynamic(() => import("@/components/Footer"));

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
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-2 py-6 sm:gap-20 sm:px-4 sm:py-8 lg:px-8">
        
        {/* Hero Area */}
        <HeroSection />

        {/* Introduction / Problem & Solution */}
        <div id="about">
          <ProblemSolutionSection />
        </div>

        {/* Counselors Grid */}
        <section id="counselors" className="scroll-mt-24">
          <div className="mb-12 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wider mb-4">
              OUR COUNSELORS
            </span>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              専門分野から選ぶ
            </h2>
            <p className="mt-4 text-slate-600 text-lg">
              あなたの悩みや目的に最適なパートナーが見つかります
            </p>
          </div>

          {loading ? (
            <div className="rounded-[40px] bg-slate-50 p-12">
              <LoadingState />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {counselors.map((counselor, index) => (
                <CounselorCard
                  key={counselor.id}
                  counselor={counselor}
                  onSelect={
                    counselor.comingSoon
                      ? undefined
                      : (id) => router.push(`/counselor/${id}`)
                  }
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </section>

        {/* Multi-Counseling Feature */}
        <MultiCounselingSection />

        {/* Pricing & CTA */}
        <div id="pricing">
          <PricingSection />
        </div>

        {/* FAQ (Keeping as it's useful) */}
        <FAQSection />
      </div>
      <Footer />
    </div>
  );
}
