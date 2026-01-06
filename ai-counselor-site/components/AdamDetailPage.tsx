"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Compass, Leaf, Lightbulb, Recycle } from "lucide-react";

export default function AdamDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const highlights = [
    {
      icon: Compass,
      title: "バランス感覚",
      description: "主観と客観、感情と事実の両面から状況を整理し、中立的な視点を提示します。",
    },
    {
      icon: Leaf,
      title: "実用的な提案",
      description: "日常にすぐ取り入れられる呼吸法やメモ術など、負担にならない行動案を示します。",
    },
    {
      icon: Lightbulb,
      title: "気づきのヒント",
      description: "「もし◯◯だったら?」という問いかけで、新しい捉え方を自然に引き出します。",
    },
    {
      icon: Recycle,
      title: "切り替えサポート",
      description: "小さなリズムチェンジ（散歩、深呼吸、3分タスク）で気持ちの循環を整えます。",
    },
  ];

  const steps = [
    {
      title: "今の気持ちを書く",
      detail: "短くてもOK。思いつくままに感情や状況を書き出してください。",
    },
    {
      title: "視点を増やす",
      detail: "アダムが事実・感情・未来など複数の視点から整理します。",
    },
    {
      title: "一歩動く",
      detail: "すぐ試せるマイクロアクションを一緒に決めて、小さな変化を重ねます。",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fff9] via-white to-[#ecfdf5] text-[#0f3d2e]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[10%] top-[20%] h-72 w-72 rounded-full bg-emerald-100 blur-[140px]" />
          <div className="absolute right-[12%] top-[35%] h-96 w-96 rounded-full bg-teal-100 blur-[180px]" />
        </div>

        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-5 py-2.5 text-sm text-emerald-800 backdrop-blur-sm transition hover:bg-white"
          >
            ← TOPに戻る
          </button>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-end lg:gap-16">
            <div className="relative h-52 w-52 flex-shrink-0">
              <Image
                src="/images/counselors/adam.png"
                alt="アダム"
                fill
                className="rounded-[38px] bg-white object-contain shadow-[0_20px_60px_rgba(16,94,72,0.25)]"
                priority
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <p className="font-shippori text-sm tracking-[0.4em] text-emerald-700">万能型 AI カウンセラー</p>
              <h1 className="font-shippori mt-4 text-5xl font-bold text-[#063221]">
                Adam
                <span className="ml-3 text-3xl font-normal text-emerald-700">アダム</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[#0f3d2e]">
                感情にも論理にも偏りすぎないニュートラルな伴走役。<br className="hidden sm:inline" />
                相談内容をコンパクトに整理しながら、小さく進むヒントを一緒に見つけます。
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {["中立", "実用的", "多角的視点"].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-emerald-200 bg-white/80 px-5 py-2 text-sm font-semibold text-emerald-800"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 text-sm text-emerald-800 sm:flex-row sm:text-base">
                <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="font-semibold text-[#063221]">得意な相談</p>
                  <p className="mt-2">メンタルケア / 人間関係 / キャリア迷い / やる気回復</p>
                </div>
                <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="font-semibold text-[#063221]">推奨の使い方</p>
                  <p className="mt-2">その場の愚痴 → 整理 → 行動案の3ステップ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#063221] sm:text-4xl">アダムのスタイル</h2>
          <p className="mt-4 text-center text-emerald-800">力みすぎないテンポで、気持ちと現実の両方を扱います。</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-[#063221]">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-emerald-800">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f1fbf5] px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#063221] sm:text-4xl">相談の進め方</h2>
          <p className="mt-4 text-center text-emerald-800">軽く話しても、本題から入ってもOK。あなたのペースで進められます。</p>

          <div className="mt-12 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 font-shippori text-2xl font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-shippori text-xl font-bold text-[#063221]">{step.title}</p>
                  <p className="mt-2 text-emerald-800">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-emerald-100 bg-white/90 p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-[#063221] sm:text-4xl">考えすぎてしまう日こそ、軽やかに整えましょう。</h2>
          <p className="mt-4 text-lg text-emerald-800">アダムが中立な視点で整理し、小さな前進を一緒に作ります。</p>
          <button
            type="button"
            onClick={() => router.push("/counselor/chat/adam")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-4 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
          >
            無料で相談を始める
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-emerald-600">ログイン後すぐにご利用いただけます</p>
        </div>
      </section>
    </div>
  );
}
