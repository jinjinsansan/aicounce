"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, Target, MessageCircle, Search, ArrowRight } from "lucide-react";

export default function MichelleDetailPage() {
  const router = useRouter();

  const categories = [
    { id: "love", label: "恋愛の悩み", color: "from-pink-400 to-rose-400" },
    { id: "life", label: "人生の悩み", color: "from-orange-400 to-orange-300" },
    { id: "relationship", label: "人間関係", color: "from-purple-400 to-pink-400" },
  ];

  const features = [
    {
      icon: BookOpen,
      title: "1,300以上の心理学知識",
      description: "テープ式心理学の豊富なナレッジベースから、あなたの状況に最適なアドバイスを提供します。",
    },
    {
      icon: Target,
      title: "3段階のフェーズガイド",
      description: "探る→深める→手放す。会話の流れに応じて最適なガイドアクションを提案します。",
    },
    {
      icon: MessageCircle,
      title: "カテゴリー別アプローチ",
      description: "恋愛、人生、人間関係。それぞれの悩みに特化した専門的な対話を実現します。",
    },
    {
      icon: Search,
      title: "SINR検索による深い洞察",
      description: "2層構造の知識検索により、表面的ではない本質的な気づきをサポートします。",
    },
  ];

  const steps = [
    { number: "1", title: "カテゴリーを選ぶ", description: "恋愛・人生・人間関係から選択（初回のみ）" },
    { number: "2", title: "自由に相談する", description: "思いのままに気持ちを言葉にしてください" },
    { number: "3", title: "ガイドを受ける", description: "会話の深さに応じた提案を受け取れます" },
  ];

  return (
    <div className="min-h-screen bg-[#fffdfa]">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[10%] top-[15%] h-96 w-96 rounded-full bg-gradient-to-br from-orange-200/40 to-pink-200/40 blur-3xl" />
          <div className="absolute right-[15%] top-[25%] h-80 w-80 rounded-full bg-gradient-to-br from-pink-200/30 to-purple-200/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-5 py-2.5 text-sm text-slate-700 backdrop-blur-sm transition hover:bg-white"
          >
            ← TOPに戻る
          </button>

          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
            <div className="relative h-48 w-48 flex-shrink-0">
              <Image
                src="/images/counselors/michelle.png"
                alt="Michelle"
                fill
                className="rounded-full object-cover shadow-2xl"
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <p className="font-shippori text-sm font-medium tracking-wider text-orange-600">
                テープ式心理学カウンセラー
              </p>
              <h1 className="font-shippori mt-3 text-5xl font-bold text-slate-900 sm:text-6xl">
                Michelle
                <span className="block text-3xl font-normal text-slate-600 sm:text-4xl">ミシェル</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-700">
                心の奥深くに眠る感情を、テープ式心理学の知見で整理し、
                <br className="hidden sm:inline" />
                あなた自身が気づきを得られるよう寄り添います。
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className={`rounded-full bg-gradient-to-r ${cat.color} px-5 py-2 text-sm font-semibold text-white shadow-md`}
                  >
                    {cat.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            ミシェルの特徴
          </h2>
          <p className="mt-4 text-center text-slate-600">
            1,300以上の専門知識と独自のガイドシステムで、あなたの心に寄り添います
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 text-orange-600 transition group-hover:scale-110">
                    <Icon size={28} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            相談の流れ
          </h2>
          <p className="mt-4 text-center text-slate-600">シンプルな3ステップで、深い対話が始まります</p>

          <div className="mt-12 space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-6">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-400 font-shippori text-2xl font-bold text-white shadow-lg">
                  {step.number}
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="font-shippori text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-slate-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="mt-4 hidden text-slate-300 sm:block" size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-slate-900 sm:text-4xl">
            今すぐ、心を整理しませんか？
          </h2>
          <p className="mt-4 text-lg text-slate-700">
            ミシェルが、あなたの気持ちに寄り添い、深い気づきをサポートします。
          </p>
          <button
            type="button"
            onClick={() => router.push("/counselor/chat/michele")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-10 py-4 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105 hover:shadow-orange-300/50"
          >
            相談を始める
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-slate-500">初回ログインが必要です</p>
        </div>
      </section>
    </div>
  );
}
