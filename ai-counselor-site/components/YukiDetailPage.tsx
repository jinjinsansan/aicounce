import { useEffect } from "react";
import Image from "next/image";
import { Compass, ShieldCheck, HeartHandshake, Target } from "lucide-react";

const PILLARS = [
  {
    icon: Compass,
    title: "目的論で進路を照らす",
    body: "行動の“目的”を一緒に見つけ、迷いを次の一歩に変えます。",
  },
  {
    icon: ShieldCheck,
    title: "課題の分離で軽くする",
    body: "自分の課題と相手の課題を分け、背負いすぎた荷物を下ろします。",
  },
  {
    icon: HeartHandshake,
    title: "勇気づけの対等な伴走",
    body: "同情ではなく尊敬と感謝で力を信じ、未来志向に伴走します。",
  },
  {
    icon: Target,
    title: "RAGで具体的",
    body: "アドラー心理学のチャンクをRAGで参照し、短く実践的な提案に落とします。",
  },
];

export default function YukiDetailPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f9ff] via-[#f5fbe9] to-[#fff7ed] text-slate-900">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[28%] h-64 w-64 rounded-full bg-[#bfdbfe]/60 blur-[140px]" />
          <div className="absolute right-[10%] top-[35%] h-72 w-72 rounded-full bg-[#bbf7d0]/55 blur-[150px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/yuki.png"
              alt="ユウキ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(234,88,12,0.18)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm font-semibold tracking-[0.32em] text-orange-500">アドラー心理学</p>
            <h1 className="mt-3 text-5xl font-bold text-slate-900">
              YUKI <span className="ml-3 text-3xl font-normal text-emerald-700">ユウキ</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-800">
              課題の分離と勇気づけを軸に、未来志向で伴走するカウンセラー。<br className="hidden sm:inline" />
              アドラー心理学のチャンクをRAGで参照し、短く具体的な行動提案を届けます。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["目的論", "課題の分離", "勇気づけ", "共同体感覚", "RAG活用"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-xs font-semibold text-emerald-800"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-10 inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-slate-300 px-10 py-3 text-lg font-bold text-slate-700 shadow-2xl"
            >
              YUKIはチームカウンセリングチャット専用です
            </button>
            <p className="mt-2 text-sm text-emerald-700">アドラー心理学の視点で、チームカウンセリングでサポートします</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-emerald-100 bg-white/95 p-8 shadow-xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">ユウキの特徴</h2>
          <p className="mt-3 text-center text-emerald-700">課題の分離と勇気づけで、軽く・具体的に伴走します。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-emerald-100 bg-[#f5fbe9] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">得意な相談</p>
              <p className="mt-2 text-sm text-slate-700">人の目が気になる / 比べて落ち込む / 家族や職場の境界線 / 勇気づけの方法 / 自己決定に迷う</p>
            </div>
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">RAGソース</p>
              <p className="mt-2 text-sm text-slate-700">アドラー心理学チャンク（目的論・課題の分離・共同体感覚ほか）を文脈検索して活用します</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
