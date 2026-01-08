"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ClipboardList, HeartHandshake, LifeBuoy, NotebookPen, ShieldCheck } from "lucide-react";

const SUPPORT_PILLARS = [
  {
    icon: HeartHandshake,
    title: "傾聴と共感",
    description: "まずは感じていることをそのまま受け止め、安心して話せる場づくりから始めます。",
  },
  {
    icon: ShieldCheck,
    title: "安全の確保",
    description: "危機キーワードを常時モニタリングし、必要な支援先をすぐ案内できるよう整えています。",
  },
  {
    icon: LifeBuoy,
    title: "福祉的サポート",
    description: "公的制度や地域資源を踏まえ、今日から実践できる支援策や頼れる窓口を紹介します。",
  },
  {
    icon: NotebookPen,
    title: "小さな一歩の提案",
    description: "押し付けではなく、「もしよければ」というスタンスで次の行動を一緒に整えます。",
  },
];

const SESSION_FLOW = [
  {
    step: "1",
    title: "気持ちを預ける",
    detail: "今の状態を短い言葉でも大丈夫。何から話してもナナが丁寧に受け止めます。",
  },
  {
    step: "2",
    title: "RAGで知識を呼び出す",
    detail: "依存症家庭・自責感・孤立など52本のチャンクから、状況に沿う情報をピックアップ。",
  },
  {
    step: "3",
    title: "寄り添い+実践提案",
    detail: "「あなたのせいではない」というメッセージと共に、今日できる小さなケアを一緒に考えます。",
  },
];

const BADGES = ["精神保健福祉士視点", "安心・秘密厳守", "現実的アドバイス"];

export default function NanaDetailPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff5f7] via-[#ffe4e6] to-[#fff1f2] text-[#9d174d]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[10%] top-[25%] h-72 w-72 rounded-full bg-[#fecdd3]/40 blur-[150px]" />
          <div className="absolute right-[8%] top-[35%] h-80 w-80 rounded-full bg-[#ffe4e6]/50 blur-[180px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/nana.png"
              alt="ナナ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(244,114,182,0.28)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="font-shippori text-sm tracking-[0.4em] text-[#f472b6]">精神保健福祉士</p>
            <h1 className="font-shippori mt-4 text-5xl font-bold text-[#9d174d]">
              Nana <span className="ml-3 text-3xl font-normal text-[#ec4899]">ナナ</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#9d174d]/80">
              優しく包み込む傾聴と、福祉の現場で培った実践力。<br className="hidden sm:inline" />
              RAGで整理した知識を背景に、今の暮らしに寄り添うサポートを届けます。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {BADGES.map((badge) => (
                <span key={badge} className="rounded-full border border-[#fbcfe8] bg-white/80 px-5 py-2 text-sm font-semibold text-[#be123c]">
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-3 text-sm text-[#be123c] sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="font-semibold text-[#be123c]">得意な相談</p>
                <p className="mt-2">依存症家庭 / 自責感 / 生きづらさ / 子育て不安 / 支援制度</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="font-semibold text-[#be123c]">RAGソース</p>
                <p className="mt-2">親子・自責・孤立・支援制度など78チャンク（SINR構造）</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#9d174d] sm:text-4xl">ナナの4つの支援柱</h2>
          <p className="mt-4 text-center text-[#ec4899]">「話す・守る・支える・進める」を繰り返しながら、安心して頼れる存在を目指します。</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {SUPPORT_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="rounded-3xl border border-[#fbcfe8] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffe4e6] text-[#ec4899]">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-[#9d174d]">{pillar.title}</h3>
                  <p className="mt-3 leading-relaxed text-[#be123c]">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fff5f7] px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#9d174d] sm:text-4xl">セッションの流れ</h2>
          <div className="mt-10 space-y-6">
            {SESSION_FLOW.map((item) => (
              <div key={item.step} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#fbcfe8] font-shippori text-2xl font-bold text-[#9d174d]">
                  {item.step}
                </div>
                <div>
                  <p className="font-shippori text-xl font-bold text-[#9d174d]">{item.title}</p>
                  <p className="mt-2 text-[#be123c]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[#fbcfe8] bg-white/95 p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-[#9d174d] sm:text-4xl">支援の輪に、あなたも入ってください</h2>
          <p className="mt-4 text-lg text-[#be123c]">話したいタイミングでいつでも。ナナがやさしく伴走します。</p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-8 inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-slate-300 px-10 py-4 font-shippori text-lg font-bold text-slate-700 shadow-2xl"
          >
            ナナはチームカウンセリングチャット専用です
          </button>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-dashed border-[#fbcfe8] px-4 py-2 text-sm text-[#be123c]">
            <ClipboardList className="h-4 w-4" /> RAG（精神保健福祉チャンク）× GPT-4o-mini
          </div>
        </div>
      </section>
    </div>
  );
}
