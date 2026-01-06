"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, BookOpenCheck, Heart, Lamp, Sparkles } from "lucide-react";

export default function NazareDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pillars = [
    {
      icon: Lamp,
      title: "静かな導き",
      description: "心のざわめきを受け止め、聖句を通じてゆっくりと希望の光をともします。",
    },
    {
      icon: BookOpenCheck,
      title: "経典に根ざした知恵",
      description: "豊富な聖書チャンクをRAG検索で呼び出し、状況に最適な御言葉を提示します。",
    },
    {
      icon: Heart,
      title: "寄り添う姿勢",
      description: "裁くことなく、愛する子として受けとめながら感情と言葉をほどきます。",
    },
    {
      icon: Sparkles,
      title: "祈りと実践",
      description: "祈りの言葉・黙想・優しい行動提案で、日常に活かせるケアを示します。",
    },
  ];

  const flow = [
    {
      step: "1",
      title: "心の状態を分かち合う",
      detail: "感じていることをそのまま綴ってください。短い言葉でも大丈夫です。",
    },
    {
      step: "2",
      title: "御言葉とつながる",
      detail: "RAG検索で抽出した聖書箇所をもとに、状況へ寄り添ったメッセージをお届けします。",
    },
    {
      step: "3",
      title: "実践と祈り",
      detail: "祈りの言葉や今日の小さなアクションを一緒に決め、次の一歩を整えます。",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf5] via-white to-[#f0f4ff] text-[#2f1f0f]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[25%] h-72 w-72 rounded-full bg-[#fde68a]/40 blur-[140px]" />
          <div className="absolute right-[12%] top-[35%] h-80 w-80 rounded-full bg-[#c7d2fe]/40 blur-[180px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/nazare.png"
              alt="ナザレ"
              fill
              className="rounded-[40px] bg-white object-contain shadow-[0_25px_70px_rgba(90,64,35,0.25)]"
              priority
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="font-shippori text-sm tracking-[0.4em] text-[#a16207]">聖書カウンセリング</p>
            <h1 className="font-shippori mt-4 text-5xl font-bold text-[#4a2c14]">
              Nazare
              <span className="ml-3 text-3xl font-normal text-[#92400e]">ナザレ</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#4a2c14]">
              静かに耳を傾け、御言葉で心を照らす伴走者。<br className="hidden sm:inline" />
              RAG検索で最適な聖句を見つけ出し、一緒に祈りと実践へつなげます。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {[
                "聖書の知恵",
                "静かな共感",
                "祈りの提案",
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[#fcd34d] bg-white/80 px-5 py-2 text-sm font-semibold text-[#92400e]"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 text-sm text-[#7c4a1d] sm:flex-row sm:text-base">
              <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="font-semibold text-[#4a2c14]">得意な相談</p>
                <p className="mt-2">信仰の迷い / 喪失感 / 赦し / 静かなセルフケア</p>
              </div>
              <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="font-semibold text-[#4a2c14]">RAGソース</p>
                <p className="mt-2">福音書・詩篇・預言書など94件の聖書チャンク</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#4a2c14] sm:text-4xl">ナザレの4つの柱</h2>
          <p className="mt-4 text-center text-[#8c5a2a]">聖句・共感・黙想・実践をバランスよく提供します。</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-[#fcd34d]/40 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fef3c7] text-[#a16207]">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-[#4a2c14]">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-[#6b3f1c]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fff7ed] px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#4a2c14] sm:text-4xl">セッションの流れ</h2>
          <div className="mt-10 space-y-6">
            {flow.map((item) => (
              <div key={item.step} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#fcd34d] font-shippori text-2xl font-bold text-[#4a2c14]">
                  {item.step}
                </div>
                <div>
                  <p className="font-shippori text-xl font-bold text-[#4a2c14]">{item.title}</p>
                  <p className="mt-2 text-[#6b3f1c]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[#fcd34d]/60 bg-white/95 p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-[#4a2c14] sm:text-4xl">静かな時間を、御言葉と共に。</h2>
          <p className="mt-4 text-lg text-[#6b3f1c]">心の奥にある言葉をそのまま預けてください。ナザレが優しく受け止めます。</p>
          <button
            type="button"
            onClick={() => router.push("/counselor/chat/nazare")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] px-10 py-4 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
          >
            相談を始める
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-[#a16207]">ログイン後すぐにご利用いただけます</p>
        </div>
      </section>
    </div>
  );
}
