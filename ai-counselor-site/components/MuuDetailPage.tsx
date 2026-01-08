import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Leaf, Wind, Sparkles, Compass } from "lucide-react";

const PILLARS = [
  {
    icon: Leaf,
    title: "森のように受け止める",
    body: "急かさずに包み込み、まず気持ちを受け止めます。",
  },
  {
    icon: Wind,
    title: "自然の比喩で視点転換",
    body: "風や霧のような比喩で、少し軽やかに見方を変えます。",
  },
  {
    icon: Sparkles,
    title: "名言チャンクをRAGで",
    body: "ムーミンのメッセージをRAG検索し、短く要約して届けます。",
  },
  {
    icon: Compass,
    title: "小さな一歩をそっと提案",
    body: "今日できる小さな行動を1つだけ、一緒に決めます。",
  },
];

export default function MuuDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f8f2] via-[#e6f2ff] to-[#f8f3ff] text-slate-900">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[26%] h-64 w-64 rounded-full bg-[#c7e8c2]/55 blur-[140px]" />
          <div className="absolute right-[10%] top-[36%] h-72 w-72 rounded-full bg-[#c7d2fe]/55 blur-[150px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/muu.png"
              alt="ムウ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(34,197,94,0.18)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm font-semibold tracking-[0.32em] text-emerald-600">北欧メッセージカウンセリング</p>
            <h1 className="mt-3 text-5xl font-bold text-slate-900">
              MUU <span className="ml-3 text-3xl font-normal text-emerald-700">ムウ</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-800">
              森と自由を愛する穏やかな友人として、名言チャンクをRAGで参照し、心を緩める一歩をそっと提案します。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["穏やか", "自然", "自由", "哲学", "小さな一歩"].map((badge) => (
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
              onClick={() => router.push("/counselor/chat/muu")}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#22c55e] via-[#60a5fa] to-[#a855f7] px-10 py-3 text-lg font-bold text-white shadow-2xl transition hover:translate-y-[1px]"
            >
              相談を始める
            </button>
            <p className="mt-2 text-sm text-emerald-700">名言チャンクをRAG検索し、穏やかな一言と小さな行動を届けます</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-emerald-100 bg-white/95 p-8 shadow-xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">ムウの特徴</h2>
          <p className="mt-3 text-center text-emerald-700">自然の比喩と名言で視点をやさしく変え、今日の小さな一歩を一緒に決めます。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-emerald-100 bg-[#f3f8f2] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
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
              <p className="mt-2 text-sm text-slate-700">落ち込み / 将来への不安 / 自分らしさ / 人間関係の疲れ / 休み方がわからない / 小さな勇気を出したい</p>
            </div>
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">RAGソース</p>
              <p className="mt-2 text-sm text-slate-700">ムーミンのメッセージチャンクを文脈検索し、核心を短く要約して回答に織り込みます</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
