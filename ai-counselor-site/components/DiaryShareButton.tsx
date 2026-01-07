"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Link as LinkIcon, Share2, X as XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buildDiaryShareText } from "@/lib/diary-share";

type SharePlatform = "copy" | "x" | "line";

type Props = {
  entryId: string;
  contentPreview: string;
  shareCount: number;
  title?: string | null;
  authorName?: string | null;
  journalDate?: string | null;
  disabled?: boolean;
  className?: string;
};

const fallbackOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

export function DiaryShareButton({
  entryId,
  contentPreview,
  shareCount,
  title,
  authorName,
  journalDate,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState(() => `${fallbackOrigin}/diary/${entryId}/share`);
  const [count, setCount] = useState(shareCount);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}/diary/${entryId}/share`);
  }, [entryId]);

  const clippedPreview = useMemo(() => {
    const trimmed = contentPreview?.trim() ?? "";
    return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
  }, [contentPreview]);

  const shareTemplate = useMemo(
    () =>
      buildDiaryShareText({
        title,
        snippet: clippedPreview,
        authorName,
        journalDate,
      }),
    [title, clippedPreview, authorName, journalDate],
  );

  const recordShare = useCallback(
    async (platform?: SharePlatform) => {
      try {
        const res = await fetch(`/api/diary/${entryId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.shareCount === "number") {
            setCount(data.shareCount);
            return;
          }
        }
        setCount((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to record diary share", error);
      }
    },
    [entryId],
  );

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      if (!shareUrl) return;
      setShareError(null);
      try {
        if (platform === "copy") {
          await navigator.clipboard.writeText(shareUrl);
        } else if (platform === "x") {
          const url = new URL("https://x.com/intent/post");
          url.searchParams.set("url", shareUrl);
          url.searchParams.set("text", shareTemplate);
          window.open(url.toString(), "_blank", "noopener,noreferrer");
        } else if (platform === "line") {
          const url = new URL("https://social-plugins.line.me/lineit/share");
          url.searchParams.set("url", shareUrl);
          window.open(url.toString(), "_blank", "noopener,noreferrer");
        }

        await recordShare(platform);
        setOpen(false);
        if (platform === "copy") {
          setCopiedTemplate(true);
          setTimeout(() => setCopiedTemplate(false), 2000);
        }
      } catch (error) {
        console.error("Share failed", error);
        setShareError("シェアに失敗しました。もう一度お試しください。");
      }
    },
    [shareUrl, shareTemplate, recordShare],
  );

  const handleCopyTemplate = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareTemplate + (shareUrl ? `\n${shareUrl}` : ""));
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
      setShareError("テンプレのコピーに失敗しました");
    }
  }, [shareTemplate, shareUrl]);

  if (disabled) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
      >
        <Share2 className="h-4 w-4" /> シェア{count > 0 ? `(${count})` : ""}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-xl">
          <p className="text-xs font-semibold text-slate-600">SNSでシェア</p>
          <div className="mt-2 rounded-2xl border border-slate-200/60 bg-slate-50 p-3 text-[11px] text-slate-700">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>X投稿テンプレ</span>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                {copiedTemplate ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} コピー
              </button>
            </div>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-800">
              {shareTemplate}
            </pre>
            <p className="mt-2 text-[10px] text-slate-500">テンプレ＋公開リンクを貼るとOGPカードが表示されます。</p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            公開リンク: <span className="font-mono text-xs text-slate-700">{shareUrl}</span>
          </p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => handleShare("copy")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <Copy className="h-4 w-4" /> リンクをコピー
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleShare("x")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <XIcon className="h-4 w-4" /> Xで投稿
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleShare("line")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> LINEでシェア
              </span>
            </button>
          </div>
          {shareError && <p className="mt-2 text-[11px] text-red-500">{shareError}</p>}
        </div>
      )}
    </div>
  );
}
