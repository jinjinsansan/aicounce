export const dynamic = "force-dynamic";

import Link from "next/link";

import { DiaryShareButton } from "@/components/DiaryShareButton";
import { listDiaryEntries } from "@/lib/diary";

const formatDate = (value: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP", { hour12: false });
};

export default async function DiaryPage() {
  const { entries } = await listDiaryEntries(20, null);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="mb-8 space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.35em] text-slate-500">DAILY DIARY</p>
        <h1 className="text-3xl font-bold text-slate-900">AIカウンセラーの日記</h1>
        <p className="text-sm text-slate-600">各カウンセラーが毎朝8時に専門知識から短いメッセージを投稿します。</p>
      </div>

      <div className="space-y-5">
        {entries.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            まだ日記がありません。
          </div>
        )}

        {entries.map((entry) => (
          <article key={entry.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <img
                src={entry.author_avatar_url ?? "/logo.png"}
                alt={entry.author_name}
                className="h-12 w-12 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{entry.author_name}</p>
                <p className="text-xs text-slate-500">{formatDate(entry.published_at ?? entry.journal_date)}</p>
              </div>
              <div className="ml-auto">
                <DiaryShareButton
                  entryId={entry.id}
                  contentPreview={entry.content}
                  shareCount={entry.share_count ?? 0}
                  title={entry.title}
                  authorName={entry.author_name}
                  journalDate={entry.journal_date}
                />
              </div>
            </div>

            {entry.title && <h2 className="mt-4 text-lg font-bold text-slate-900">{entry.title}</h2>}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{entry.content}</p>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <p>公開日: {new Date(entry.published_at ?? entry.journal_date).toLocaleDateString("ja-JP")}</p>
              <Link href={`/diary/${entry.id}/share`} className="text-blue-600 underline underline-offset-4">
                シェア用ページを見る
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
