"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Layers, Scale, Sparkles, SwitchCamera } from "lucide-react";

export default function GeminiDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const highlights = [
    {
      icon: SwitchCamera,
      title: "二面性の整理",
      description: "事実と感情、短期と長期など、異なる視点を並べて状況をわかりやすくします。",
    },
    {
      icon: Scale,
      title: "バランスのとれた助言",
      description: "0か100かに偏らず、半歩先の現実的な選択肢を3つ以内で提案します。",
    },
    {
      icon: Layers,
      title: "思考のレイヤー化",
      description: "頭の中のモヤモヤを段階的に区切り、スッと眺められるアウトラインに変換します。",
    },
    {
      icon: Sparkles,
      title: "気づきのスイッチ",
      description: "些細な発見でも大切にし、次のアクションへ繋げる軽やかな言葉がけをします。",
    },
  ];

  const flow = [
    {
      title: "ざっくり状況を送る",
      detail: "箇条書きでもOK。今気になっていることを2〜3個書き出してください。",
    },
    {
      title: "視点を切り替える",
      detail: "ジェミニがA/Bの両面から感情と事実を整理し、見落としがちな観点も補います。",
    },
    {
      title: "選べる提案を受け取る",
      detail: "すぐできる案と少し先の案を並べて提示。ご自身のペースで選択できます。",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf5ff] via-white to-[#f3e8ff] text-[#2f0f4a]">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-fuchsia-100 blur-[150px]" />
          <div className="absolute right-[15%] top-[30%] h-96 w-96 rounded-full bg-purple-100 blur-[190px]" />
        </div>

        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/80 px-5 py-2.5 text-sm text-purple-800 backdrop-blur-sm transition hover:bg-white"
          >
            ← TOPに戻る
          </button>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-end lg:gap-16">
            <div className="relative h-52 w-52 flex-shrink-0">
              <Image
                src="/images/counselors/gemini.png"
                alt="ジェミニ"
                fill
                className="rounded-[38px] bg-white object-contain shadow-[0_20px_60px_rgba(134,65,173,0.25)]"
                priority
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <p className="font-shippori text-sm tracking-[0.4em] text-fuchsia-600">多視点 AI カウンセラー</p>
              <h1 className="font-shippori mt-4 text-5xl font-bold text-[#3b0764]">
                Gemini
                <span className="ml-3 text-3xl font-normal text-purple-600">ジェミニ</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[#4a155f]">
                「どちらが正解かわからない」場面で、視野をそっと広げてくれる相談相手。<br className="hidden sm:inline" />
                二つの視点を軽やかに行き来し、選択肢を比較しやすい形に整えます。
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {["多角的", "柔軟", "軽やか"].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-purple-200 bg-white/80 px-5 py-2 text-sm font-semibold text-purple-800"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 text-sm text-purple-800 sm:flex-row sm:text-base">
                <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="font-semibold text-[#3b0764]">向いている相談</p>
                  <p className="mt-2">優柔不断 / 人間関係の板挟み / キャリア選択 / 感情の整理</p>
                </div>
                <div className="flex-1 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <p className="font-semibold text-[#3b0764]">使い方の例</p>
                  <p className="mt-2">朝の5分振り返りや、就寝前の感情整理におすすめ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#3b0764] sm:text-4xl">ジェミニの特長</h2>
          <p className="mt-4 text-center text-purple-800">感情と論理のあいだに余白を作り、選択の幅を取り戻します。</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-3xl border border-purple-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-shippori text-xl font-bold text-[#3b0764]">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-purple-900">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7ecff] px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-[#3b0764] sm:text-4xl">相談の進め方</h2>
          <p className="mt-4 text-center text-purple-800">心が揺れるテーマこそ、軽やかに視点を切り替えていきましょう。</p>

          <div className="mt-12 space-y-6">
            {flow.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 font-shippori text-2xl font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-shippori text-xl font-bold text-[#3b0764]">{step.title}</p>
                  <p className="mt-2 text-purple-900">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-purple-100 bg-white/90 p-12 text-center shadow-xl">
          <h2 className="font-shippori text-3xl font-bold text-[#3b0764] sm:text-4xl">どちらも大事にしながら、決める力を取り戻しましょう。</h2>
          <p className="mt-4 text-lg text-purple-800">ジェミニが二つの視点を並べ、余裕のある選択肢を一緒に作ります。</p>
          <button
            type="button"
            onClick={() => router.push("/counselor/chat/gemini")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-10 py-4 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
          >
            無料で相談を始める
            <ArrowRight size={20} />
          </button>
          <p className="mt-4 text-sm text-purple-700">ログイン後すぐに使えます</p>
        </div>
      </section>
    </div>
  );
}
