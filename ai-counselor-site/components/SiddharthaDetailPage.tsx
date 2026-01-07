"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Heart, Leaf, Flower2, Mountain } from "lucide-react";

export default function SiddharthaDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pillars = [
    {
      icon: Heart,
      title: "慈悲の心で傾聴",
      description: "批判や説教なく、苦しみを自然なものとして受け止め、深く共感します。",
    },
    {
      icon: Flower2,
      title: "仏教経典の智慧",
      description: "四聖諦・八正道・般若心経などの教えをRAG検索で呼び出し、現代の言葉で伝えます。",
    },
    {
      icon: Leaf,
      title: "中道のバランス",
      description: "極端を避け、楽観でも悲観でもない、現実的で希望ある見方を提供します。",
    },
    {
      icon: Mountain,
      title: "実践への導き",
      description: "瞑想・呼吸法・マインドフルネスなど、日常で取り組める具体的な方法を提案します。",
    },
  ];

  const flow = [
    {
      step: "1",
      title: "傾聴（観音の心で聴く）",
      detail: "まずはゆっくりとお話を伺います。感じていることを自由に表現してください。",
    },
    {
      step: "2",
      title: "仏教の教えを通じた気づき",
      detail: "状況に合った経典や教えをRAG検索で見つけ、押し付けず自然な形で紹介します。",
    },
    {
      step: "3",
      title: "実践的な提案",
      detail: "呼吸瞑想や慈悲の瞑想など、無理なく始められる小さな一歩を一緒に見つけます。",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] via-[#ecfdf3] to-[#e8f5e9] text-[#14532d]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[25%] h-72 w-72 rounded-full bg-[#bbf7d0]/50 blur-[140px]" />
          <div className="absolute right-[12%] top-[35%] h-80 w-80 rounded-full bg-[#dcfce7]/60 blur-[180px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/siddhartha.png"
              alt="シッダールタ"
              fill
              className="rounded-[40px] bg-white object-contain shadow-[0_25px_70px_rgba(21,128,61,0.22)]"
              priority
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="font-shippori text-sm tracking-[0.4em] text-[#16a34a]">仏教カウンセリング</p>
            <h1 className="font-shippori mt-4 text-5xl font-bold text-[#166534]">
              Siddhartha
              <span className="ml-3 text-3xl font-normal text-[#15803d]">シッダールタ</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#14532d]/90">
              仏の智慧と慈悲で心の平安へ導く伴走者。<br className="hidden sm:inline" />
              経典の教えをRAG検索で呼び出し、現代に活きる実践を共に見つけます。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["仏教の智慧", "慈悲の心", "瞑想・実践"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[#bbf7d0] bg-white/80 px-5 py-2 text-sm font-semibold text-[#166534]"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 text-sm text-[#166534] sm:flex-row sm:text-base">
              <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="font-semibold text-[#14532d]">得意な相談</p>
                <p className="mt-2">苦しみの理解 / 執着の手放し / 不安・怒り / 人生の意味</p>
              </div>
              <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="font-semibold text-[#14532d]">RAGソース</p>
                <p className="mt-2">法華経・般若心経・法句経など100親+215子チャンク</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#14532d] sm:text-4xl">シッダールタの4つの柱</h2>
          <p className="mt-4 text-center text-[#166534]">慈悲・智慧・中道・実践で心の平安を支えます。</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-[#bbf7d0] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ecfdf3] text-[#16a34a]">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-[#14532d]">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-[#166534]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f1f8f5] px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#14532d] sm:text-4xl">セッションの流れ</h2>
          <div className="mt-10 space-y-6">
            {flow.map((item) => (
              <div key={item.step} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#bbf7d0] font-shippori text-2xl font-bold text-[#14532d]">
                  {item.step}
                </div>
                <div>
                  <p className="font-shippori text-xl font-bold text-[#14532d]">{item.title}</p>
                  <p className="mt-2 text-[#166534]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[#bbf7d0] bg-white/95 p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-[#14532d] sm:text-4xl">心の平安を、仏の教えと共に。</h2>
          <p className="mt-4 text-lg text-[#166534]">苦しみも喜びも、すべてをありのままに。シッダールタが静かに寄り添います。</p>
          <button
            type="button"
            onClick={() => router.push("/counselor/chat/siddhartha")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#34d399] via-[#22c55e] to-[#16a34a] px-10 py-4 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
          >
            相談を始める
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-[#15803d]">ログイン後すぐにご利用いただけます</p>
        </div>
      </section>
    </div>
  );
}
