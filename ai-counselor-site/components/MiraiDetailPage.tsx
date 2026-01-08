import { useEffect } from "react";
import Image from "next/image";
import { Sparkles, Lightbulb, Rocket, HeartHandshake } from "lucide-react";

const PILLARS = [
  {
    icon: Sparkles,
    title: "前向きなひらめき",
    body: "悩みを未来志向に変換し、RAGの知恵から短く具体的に提案します。",
  },
  {
    icon: Lightbulb,
    title: "小さな行動ステップ",
    body: "今日からできる一歩を一緒に作り、迷いを実践に変えます。",
  },
  {
    icon: Rocket,
    title: "未来からの視点",
    body: "猫型ロボット風の相棒として、遠い視点と身近な手段を両方届けます。",
  },
  {
    icon: HeartHandshake,
    title: "やさしい伴走",
    body: "「キミ」に寄り添う語り口で、安心とユーモアを添えて励まします。",
  },
];

export default function MiraiDetailPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#dbeafe] to-[#e0f7fa] text-slate-900">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[25%] h-64 w-64 rounded-full bg-[#bae6fd]/60 blur-[140px]" />
          <div className="absolute right-[10%] top-[35%] h-72 w-72 rounded-full bg-[#a5f3fc]/50 blur-[160px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/mirai.png"
              alt="ミライ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(14,165,233,0.25)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="font-shippori text-sm tracking-[0.35em] text-sky-700">未来型ロボットカウンセラー</p>
            <h1 className="font-shippori mt-3 text-5xl font-bold text-slate-900">
              MIRAI <span className="ml-3 text-3xl font-normal text-sky-700">ミライ</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-800">
              未来からやってきた猫の形をしたロボットカウンセラー。<br className="hidden sm:inline" />
              オリジナルの未来ノート（RAG）からヒントを引き出し、キミの行動を後押しします。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["未来視点", "行動ステップ", "優しいロボット", "RAGで具体化", "前向きブルー"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-xs font-semibold text-sky-800"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-10 inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-slate-300 px-10 py-3 font-shippori text-lg font-bold text-slate-700 shadow-2xl"
            >
              MIRAIはチームカウンセリングチャット専用です
            </button>
            <p className="mt-2 text-sm text-sky-700">未来ノート（RAG）で具体的にサポートします</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-sky-100 bg-white/90 p-8 shadow-xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-slate-900 sm:text-4xl">ミライの特徴</h2>
          <p className="mt-3 text-center text-sky-700">RAGの教えを短く引用し、今日の一歩を一緒に作る未来型カウンセラー。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-sky-100 bg-[#f8fbff] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-shippori text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">得意な相談</p>
              <p className="mt-2 text-sm text-slate-700">未来への不安 / 自信がない / 一歩踏み出せない / 習慣化したい / 優しい相棒がほしい</p>
            </div>
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">RAGソース</p>
              <p className="mt-2 text-sm text-slate-700">未来ノート（オリジナル言葉に変換済みの名言集）から状況に合わせて引用します</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
