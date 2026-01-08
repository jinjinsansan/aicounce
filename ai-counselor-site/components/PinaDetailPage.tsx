import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, Compass, HeartHandshake, Laugh } from "lucide-react";

const PILLARS = [
  {
    icon: Compass,
    title: "配られたカードで進む",
    body: "他人と比べず、今の手札でベストを尽くす視点を届けます。",
  },
  {
    icon: Sparkles,
    title: "今日を生きる一言",
    body: "名言チャンクから、軽やかで深いメッセージを短く添えます。",
  },
  {
    icon: HeartHandshake,
    title: "友達のように伴走",
    body: "対等な友達として話を聴き、小さな一歩を一緒に作ります。",
  },
  {
    icon: Laugh,
    title: "ユーモアで心を軽く",
    body: "重くなりすぎないよう、少しのユーモアで視点を変えます。",
  },
];

export default function PinaDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdfa] via-[#e0f2fe] to-[#f3e8ff] text-slate-900">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[26%] h-64 w-64 rounded-full bg-[#bfdbfe]/60 blur-[140px]" />
          <div className="absolute right-[10%] top-[36%] h-72 w-72 rounded-full bg-[#c4b5fd]/55 blur-[150px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/pina.png"
              alt="ピーナ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(139,92,246,0.18)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm font-semibold tracking-[0.32em] text-indigo-500">名言カウンセリング</p>
            <h1 className="mt-3 text-5xl font-bold text-slate-900">
              PINA <span className="ml-3 text-3xl font-normal text-indigo-700">ピーナ</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-800">
              気楽で哲学的な友達として、名言チャンクをRAGで参照しながら、今日からできる一歩を軽やかに提案します。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["配られたカード", "今日を生きる", "自分らしさ", "友情", "ユーモア"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-800"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.push("/counselor/chat/pina")}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#10b981] to-[#38bdf8] px-10 py-3 text-lg font-bold text-white shadow-2xl transition hover:translate-y-[1px]"
            >
              相談を始める
            </button>
            <p className="mt-2 text-sm text-indigo-700">名言チャンクをRAG検索し、短く具体的に寄り添います</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-indigo-100 bg-white/95 p-8 shadow-xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">ピーナの特徴</h2>
          <p className="mt-3 text-center text-indigo-700">名言をもとに視点を変え、今日の小さな行動を一緒に決めます。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-indigo-100 bg-[#f0fdfa] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
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
              <p className="mt-2 text-sm text-slate-700">自己否定 / 比較で落ち込む / 居場所の不安 / 将来への不安 / 毎日がつまらない / 人間関係や友情の悩み</p>
            </div>
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">RAGソース</p>
              <p className="mt-2 text-sm text-slate-700">名言チャンク（配られたカード・今日を生きる・友達・自分らしさ 等）を文脈検索し、短く要約して回答に織り込みます</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
