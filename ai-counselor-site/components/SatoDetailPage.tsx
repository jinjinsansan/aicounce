"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Brain,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  BookOpenCheck,
  ArrowRight,
} from "lucide-react";

export default function SatoDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const badges = [
    "臨床心理学博士監修",
    "エビデンスベース介入",
    "16講座RAGナレッジ",
  ];

  const features = [
    {
      icon: Brain,
      title: "臨床心理学の知見",
      description:
        "臨床心理学の専門資料500件以上をSINR方式で整理。面接技法や感情整理のプロセスを文脈ごとに提示します。",
    },
    {
      icon: ShieldCheck,
      title: "安心を生む対話設計",
      description:
        "導入・共感・心理教育・課題設定の4フェーズで対話を構成し、相談者が無理なく自己理解を深められるよう伴走します。",
    },
    {
      icon: HeartPulse,
      title: "身体感覚にも配慮",
      description:
        "呼吸やセルフグラウンディングのガイドを自動提案。緊張が高い場面でも落ち着きを取り戻す工夫を備えています。",
    },
    {
      icon: Sparkles,
      title: "状況に応じたRAG引用",
      description:
        "過去のケーススタディや心理教育素材を適切に引用し、説得力のあるフィードバックを即時に提供します。",
    },
  ];

  const steps = [
    {
      title: "テーマを伝える",
      detail: "気分・対人・自己理解など、今向き合いたいテーマを一言そえてください。",
    },
    {
      title: "ゆっくり話す",
      detail: "敬語ベースの穏やかな語り口で受け止め、必要に応じて質問やリフレクションを行います。",
    },
    {
      title: "実践ヒントを受け取る",
      detail: "感情メモ、セルフケア、専門医受診の目安などを行動案としてまとめます。",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7fb] via-white to-[#eef4ff]">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[20%] h-80 w-80 rounded-full bg-blue-200/30 blur-[120px]" />
          <div className="absolute right-[18%] top-[25%] h-96 w-96 rounded-full bg-cyan-100/40 blur-[140px]" />
        </div>

        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm text-slate-700 backdrop-blur-sm transition hover:bg-white"
          >
            ← TOPに戻る
          </button>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-end lg:gap-16">
            <div className="relative h-52 w-52 flex-shrink-0">
              <Image
                src="/images/counselors/dr_satou.png"
                alt="ドクター・サトウ"
                fill
                className="rounded-[36px] object-cover shadow-[0_20px_60px_rgba(30,64,175,0.25)]"
                priority
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <p className="font-shippori text-sm font-medium tracking-[0.4em] text-blue-700">
                臨床心理学 AI カウンセラー
              </p>
              <h1 className="font-shippori mt-4 text-5xl font-bold text-slate-900">
                Dr. Sato
                <span className="ml-3 text-3xl font-normal text-slate-600">ドクター・サトウ</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-700">
                認知行動療法や臨床心理査定の知見をもとに、感情と行動のつながりを丁寧に整理。
                <br className="hidden sm:inline" />
                「わかってもらえた」と感じられる安全な対話空間をご用意します。
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-gradient-to-r from-blue-600/90 to-cyan-500/90 px-5 py-2 text-sm font-semibold text-white"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:text-base">
                <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">主なサポート領域</p>
                  <p className="mt-2 text-slate-600">不安・抑うつ / 対人ストレス / 自己受容 / キャリア迷い</p>
                </div>
                <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">推奨セッション頻度</p>
                  <p className="mt-2 text-slate-600">週1回の振り返り + 必要時のスポット相談</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            ドクター・サトウの特徴
          </h2>
          <p className="mt-4 text-center text-slate-600">
            専門知識とあたたかいフィードバックで、ゆっくりと自己理解を深めていきます
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-100 text-blue-700 group-hover:scale-110">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="bg-slate-50/80 px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            相談の進め方
          </h2>
          <p className="mt-4 text-center text-slate-600">
            静かなテンポで寄り添いながら、心の輪郭を一緒に描いていきます
          </p>

          <div className="mt-12 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 font-shippori text-2xl font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-shippori text-xl font-bold text-slate-900">{step.title}</p>
                  <p className="mt-2 text-slate-600">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence section */}
      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-10 text-white shadow-2xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
            <div className="flex-1">
              <p className="font-shippori text-sm uppercase tracking-[0.4em] text-white/70">
                Knowledge Base
              </p>
              <h2 className="font-shippori mt-4 text-3xl font-bold sm:text-4xl">
                500件以上の臨床心理学ノートとSINR検索で、文脈の抜けを防ぎます。
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/90">
                認知評価・感情理解・介入提案を親和性の高い順に提示。必要に応じて医療機関への
                相談も優しくお伝えします。
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-4 rounded-3xl bg-white/15 p-6 text-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <BookOpenCheck className="text-white" size={24} />
                <div>
                  <p className="text-lg font-semibold">臨床心理学講義</p>
                  <p className="text-white/80">500件以上・計523チャンクを参照</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="text-white" size={24} />
                <div>
                  <p className="text-lg font-semibold">SINRハイブリッド検索</p>
                  <p className="text-white/80">親子チャンクで前後文脈をフォロー</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HeartPulse className="text-white" size={24} />
                <div>
                  <p className="text-lg font-semibold">セルフケア提案</p>
                  <p className="text-white/80">感情メモ・行動実験・受診目安</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-blue-100 bg-white/90 p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-slate-900 sm:text-4xl">
            心の声を、そっと言葉にしてみませんか？
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            ドクター・サトウが静かに耳を傾け、安心できるステップで整理をお手伝いします。
          </p>
          <button
            type="button"
            onClick={() => router.push("/counselor/chat/sato")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-10 py-4 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
          >
            無料で相談を始める
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-slate-500">ログイン後すぐにご利用いただけます</p>
        </div>
      </section>
    </div>
  );
}
