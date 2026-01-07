"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Bookmark, Columns, Feather, Shield } from "lucide-react";

export default function ClaudeDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const pillars = [
    {
      icon: Shield,
      title: "境界線を守る姿勢",
      description: "相談者の価値観やペースを優先し、無理に踏み込まない落ち着いた対話を行います。",
    },
    {
      icon: Columns,
      title: "章立てで整理",
      description: "事実・感情・判断材料を章のように区切り、複雑なテーマでも読みやすく整えます。",
    },
    {
      icon: Bookmark,
      title: "倫理的な視点",
      description: "短期の感情だけでなく、中長期の影響や守りたい価値を一緒に確かめます。",
    },
    {
      icon: Feather,
      title: "静かな語り口",
      description: "句読点や改行を丁寧に使い、呼吸を整えながら読める文章で寄り添います。",
    },
  ];

  const steps = [
    {
      title: "背景を共有",
      detail: "時系列や登場人物など、必要に応じて補足をお願いすることがあります。",
    },
    {
      title: "価値観を並べる",
      detail: "大切にしたいこと／避けたいことを整理し、判断の軸を可視化します。",
    },
    {
      title: "静かに前進",
      detail: "一度立ち止まって自己ケアを促しつつ、次の一歩を慎重に提案します。",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-white to-[#e7e9ee] text-[#111827]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[18%] top-[22%] h-72 w-72 rounded-full bg-slate-200 blur-[160px]" />
          <div className="absolute right-[20%] top-[30%] h-80 w-80 rounded-full bg-indigo-100 blur-[170px]" />
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
                src="/images/counselors/claude.png"
                alt="クロード"
                fill
                className="rounded-[34px] bg-white object-contain shadow-[0_20px_60px_rgba(51,65,85,0.25)]"
                priority
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <p className="font-shippori text-sm tracking-[0.4em] text-slate-500">思慮深い AI カウンセラー</p>
              <h1 className="font-shippori mt-4 text-5xl font-bold text-slate-900">
                Claude
                <span className="ml-3 text-3xl font-normal text-slate-500">クロード</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-700">
                感情を乱さずに考えを整えたいときの相談役。<br className="hidden sm:inline" />
                静かなテンポで背景を整理し、納得感のある判断を後押しします。
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {["倫理的", "落ち着いた語り口", "章立て"].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 text-sm text-slate-700 sm:flex-row sm:text-base">
                <div className="flex-1 rounded-2xl bg-white/90 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">得意な相談</p>
                  <p className="mt-2">価値観の揺らぎ / 重大な決断 / 家族・職場の調整 / 情報の整理</p>
                </div>
                <div className="flex-1 rounded-2xl bg-white/90 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">おすすめの使い方</p>
                  <p className="mt-2">夜の振り返り・文章を整えたいとき・誰かに説明する前の下書き</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-slate-900 sm:text-4xl">クロードのスタイル</h2>
          <p className="mt-4 text-center text-slate-600">過度な演出をせず、淡々と事実と感情を整えます。</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#eef1f5] px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-slate-900 sm:text-4xl">相談の進め方</h2>
          <p className="mt-4 text-center text-slate-600">落ち着きたいときに、静かに寄り添う進行で進めていきます。</p>

          <div className="mt-12 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 font-shippori text-2xl font-bold text-white">
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

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-slate-900 sm:text-4xl">言葉を整える時間を、一緒に取り戻しましょう。</h2>
          <p className="mt-4 text-lg text-slate-600">クロードが静かに話を聞き、章立てで整理しながら次の一歩を示します。</p>
          <button
            type="button"
            onClick={() => router.push("/counselor/chat/claude")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-10 py-4 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
          >
            相談を始める
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-slate-500">ログイン後にすぐご利用いただけます</p>
        </div>
      </section>
    </div>
  );
}
