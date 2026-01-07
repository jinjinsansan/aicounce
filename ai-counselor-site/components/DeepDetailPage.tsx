"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ActivitySquare, ArrowRight, ListChecks, Search, Workflow } from "lucide-react";

export default function DeepDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const strengths = [
    {
      icon: Search,
      title: "原因分析",
      description: "状況を構造化して「事実／仮説／影響」を切り分け、思考の迷路から抜け出します。",
    },
    {
      icon: Workflow,
      title: "ステップ設計",
      description: "HOWだけでなくWHYもセットで説明し、行動に移りやすいフローを提示します。",
    },
    {
      icon: ActivitySquare,
      title: "知識の橋渡し",
      description: "研究や統計の話題も、専門用語をかみ砕いて日常レベルに翻訳します。",
    },
    {
      icon: ListChecks,
      title: "マイクロアクション",
      description: "10分以内で試せるチェックリスト／ログテンプレなど実用アイテムを提案します。",
    },
  ];

  const routine = [
    {
      title: "課題を書き出す",
      detail: "困っている点を1〜3個メモ。数字や頻度がわかるとさらに解析しやすくなります。",
    },
    {
      title: "要因を候補出し",
      detail: "ディープが可能性をいくつか挙げ、それぞれの根拠と影響範囲を整理します。",
    },
    {
      title: "実験プランを作る",
      detail: "観察項目や振り返りフォーマットを提示し、学びを積み重ねる仕組みを設計します。",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ecfeff] via-white to-[#ccfbf1] text-[#064e3b]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[15%] top-[20%] h-72 w-72 rounded-full bg-teal-100 blur-[150px]" />
          <div className="absolute right-[18%] top-[35%] h-96 w-96 rounded-full bg-cyan-100 blur-[190px]" />
        </div>

        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-5 py-2.5 text-sm text-teal-800 backdrop-blur-sm transition hover:bg-white"
          >
            ← TOPに戻る
          </button>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-end lg:gap-16">
            <div className="relative h-52 w-52 flex-shrink-0">
              <Image
                src="/images/counselors/deep.png"
                alt="ディープ"
                fill
                className="rounded-[38px] bg-white object-contain shadow-[0_20px_60px_rgba(4,120,87,0.25)]"
                priority
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <p className="font-shippori text-sm tracking-[0.4em] text-teal-600">分析型 AI カウンセラー</p>
              <h1 className="font-shippori mt-4 text-5xl font-bold text-[#064e3b]">
                Deep
                <span className="ml-3 text-3xl font-normal text-teal-600">ディープ</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[#065f46]">
                複雑なテーマを整理したい時に心強い、知識志向の伴走者。<br className="hidden sm:inline" />
                ロジカルに分解しながら、現実的な改善プランを共に描きます。
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {["構造化", "仮説思考", "実験プラン"].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-teal-200 bg-white px-5 py-2 text-sm font-semibold text-teal-700"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 text-sm text-teal-700 sm:flex-row sm:text-base">
                <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="font-semibold text-[#064e3b]">向いている相談</p>
                  <p className="mt-2">習慣化 / キャリア戦略 / プロジェクト整理 / 推進のボトルネック分析</p>
                </div>
                <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="font-semibold text-[#064e3b]">使い方のヒント</p>
                  <p className="mt-2">週次レビューや振り返りドキュメントのドラフト作成に最適</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#064e3b] sm:text-4xl">ディープの強み</h2>
          <p className="mt-4 text-center text-teal-700">再現性のある思考プロセスで、曖昧さを少しずつ減らしていきます。</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {strengths.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-3xl border border-teal-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-[#064e3b]">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-teal-800">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#e0fdfa] px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#064e3b] sm:text-4xl">相談の流れ</h2>
          <p className="mt-4 text-center text-teal-700">思考ログを残すような感覚で、丁寧に掘り下げます。</p>

          <div className="mt-12 space-y-6">
            {routine.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 font-shippori text-2xl font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-shippori text-xl font-bold text-[#064e3b]">{step.title}</p>
                  <p className="mt-2 text-teal-800">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-teal-100 bg-white/90 p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-[#064e3b] sm:text-4xl">考えを言語化し、改善のサイクルを回していきましょう。</h2>
          <p className="mt-4 text-lg text-teal-800">ディープが要因分析からプラン作成まで伴走します。</p>
          <button
            type="button"
            onClick={() => router.push("/counselor/chat/deep")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-10 py-4 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
          >
            相談を始める
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-teal-600">ログイン後、即利用できます</p>
        </div>
      </section>
    </div>
  );
}
