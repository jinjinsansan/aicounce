import Link from "next/link";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { buildDiaryShareText } from "@/lib/diary-share";
import { getDiaryEntry } from "@/lib/diary";
import { DiaryShareButton } from "@/components/DiaryShareButton";

type SharePageProps = {
  params: { entryId: string };
};

const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? "http://localhost:3000").replace(/\/$/, "");

const clippedPreview = (value: string) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
};

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const entry = await getDiaryEntry(params.entryId).catch(() => null);
  if (!entry || entry.is_shareable === false) {
    return {
      title: "日記が見つかりません",
      description: "公開シェア用の日記が見つかりませんでした。",
    };
  }

  const ogImageUrl = `${appUrl}/api/diary/${params.entryId}/og-image`;
  const shareUrl = `${appUrl}/diary/${params.entryId}/share`;
  const description = clippedPreview(entry.content.replace(/\s+/g, " "));
  const title = `${entry.author_name}の朝のひとこと`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      url: shareUrl,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function DiarySharePage({ params }: SharePageProps) {
  const entry = await getDiaryEntry(params.entryId);
  if (!entry || entry.is_shareable === false) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-0">
        <div className="mx-auto max-w-2xl space-y-6 rounded-[32px] border border-slate-200 bg-white/95 p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">日記が見つかりませんでした</h1>
          <p className="text-sm text-slate-600">URLが無効か、公開されていない可能性があります。</p>
          <Link
            href="/diary"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
          >
            日記一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  const shareTemplate = buildDiaryShareText({
    title: entry.title,
    snippet: clippedPreview(entry.content),
    authorName: entry.author_name,
    journalDate: entry.journal_date,
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-0">
      <div className="mx-auto max-w-2xl space-y-6 rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-sm">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold tracking-[0.35em] text-slate-500">SHARE VIEW</p>
          <h1 className="text-2xl font-bold text-slate-900">AIカウンセラーの日記をシェア</h1>
          <p className="text-sm text-slate-600">このページのURLをXやLINEに貼るとOGPカード付きで紹介できます。</p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-800">
          <p className="text-xs font-semibold text-slate-500">共有テンプレ</p>
          <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-dashed border-slate-200 bg-white p-4 font-mono text-[12px] leading-relaxed">
            {shareTemplate}
          </pre>
          <p className="mt-3 text-xs text-slate-500">テンプレにこのページのURLを添えて投稿してください。</p>
          <div className="mt-3">
            <DiaryShareButton
              entryId={entry.id}
              contentPreview={entry.content}
              shareCount={entry.share_count ?? 0}
              title={entry.title}
              authorName={entry.author_name}
              journalDate={entry.journal_date}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-5 text-sm">
          <div className="flex items-center gap-3">
            <img
              src={entry.author_avatar_url ?? "/logo.png"}
              alt={entry.author_name}
              className="h-12 w-12 rounded-full border border-slate-200 object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">{entry.author_name}</p>
              <p className="text-xs text-slate-500">{entry.journal_date}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">タイトル</p>
            <p className="text-base font-semibold text-slate-900">{entry.title ?? "(タイトルなし)"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">本文</p>
            <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">{entry.content}</p>
          </div>
        </section>

        <div className="flex flex-col gap-3 text-sm text-slate-600">
          <Link href={`/diary`} className="text-center">
            <span className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-slate-800 transition hover:bg-slate-50">
              日記一覧に戻る
            </span>
          </Link>
          <p className="text-center text-xs">URLをコピーして各SNSに貼るとOGPカードが生成されます。</p>
        </div>
      </div>
    </main>
  );
}
