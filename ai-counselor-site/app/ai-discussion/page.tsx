import { Metadata } from "next";
import { fetchCounselors } from "@/lib/counselors";
import AiDiscussionView from "@/components/AiDiscussionView";

export const metadata: Metadata = {
  title: "AI議論ライブ | メンタルAIチーム",
  description:
    "2体のAIカウンセラーがリアルタイムで議論し、まとめ役が結論を提示するライブページです。",
};

export default async function AiDiscussionPage() {
  const counselors = await fetchCounselors();
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-12">
        <div className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            AI Live Debate
          </p>
          <h1 className="text-3xl font-black text-slate-900">AI議論ライブ</h1>
          <p className="text-slate-600">
            好きなAIを選び、お題とラウンド数を決めると、白熱した議論がリアルタイムで展開されます。
          </p>
        </div>
        <AiDiscussionView counselors={counselors} />
      </div>
    </div>
  );
}
