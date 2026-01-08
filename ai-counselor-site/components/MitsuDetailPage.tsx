import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Feather, HeartHandshake, Clock3, Sparkles } from "lucide-react";

const POINTS = [
  { icon: Feather, title: "弱さを許す", body: "失敗や迷いも『にんげんだもの』と受け止めます。" },
  { icon: HeartHandshake, title: "感謝を添える", body: "おかげさまの視点で、今あるものをそっと見つめます。" },
  { icon: Clock3, title: "急がない", body: "短い言葉で、今ここにとどまる安心を届けます。" },
  { icon: Sparkles, title: "一歩だけ", body: "RAGからの気づきを短くまとめ、今日の小さな一歩を提案します。" },
];

export default function MitsuDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfaf5] via-[#f5f0e6] to-[#f7f6ef] text-slate-900">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[24%] h-64 w-64 rounded-full bg-[#f1eadd]/70 blur-[140px]" />
          <div className="absolute right-[10%] top-[32%] h-72 w-72 rounded-full bg-[#f3d9a4]/55 blur-[150px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/mitsu.png"
              alt="ミツ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(198,138,46,0.18)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm font-semibold tracking-[0.32em] text-amber-700">書のことばカウンセリング</p>
            <h1 className="mt-3 text-5xl font-bold text-slate-900">
              Mitsu <span className="ml-3 text-3xl font-normal text-amber-700">ミツ</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-800">
              素朴なことばで弱さを肯定し、今ここをそっと照らします。RAGで言葉の断片を探し、短い一歩を一緒に決めます。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["弱さの肯定", "感謝", "今ここ", "ゆっくり", "一歩だけ"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-amber-100 bg-white/90 px-4 py-2 text-xs font-semibold text-amber-800"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.push("/counselor/chat/mitsu")}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c68a2e] via-[#d97706] to-[#8c6b3f] px-10 py-3 text-lg font-bold text-white shadow-2xl transition hover:translate-y-[1px]"
            >
              相談を始める
            </button>
            <p className="mt-2 text-sm text-amber-700">RAGで見つけた短い言葉を、自分の声で届けます</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-amber-100 bg-white/95 p-8 shadow-xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">ミツの特徴</h2>
          <p className="mt-3 text-center text-amber-700">にんげんだもの、を前提に。短い言葉で心をゆるめ、今日の一歩を決めます。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-amber-100 bg-[#fdfaf5] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
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
              <p className="mt-2 text-sm text-slate-700">失敗の後悔 / 自己否定 / 焦り / 人との比較 / 感謝を忘れがち / 立ち止まりたい</p>
            </div>
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">RAGソース</p>
              <p className="mt-2 text-sm text-slate-700">書のような短い言葉のチャンクを検索し、1〜2件を要約して自分の声で伝えます</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
