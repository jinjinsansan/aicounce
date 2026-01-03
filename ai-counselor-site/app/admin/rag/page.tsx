"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Counselor } from "@/types";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { loadCounselors } from "@/lib/client-counselors";

type RagDocument = {
  id: string;
  counselor_id: string;
  title: string | null;
  source_type: string | null;
  source_id: string | null;
  created_at: string | null;
};

const SOURCE_TYPES = [
  { value: "youtube", label: "YouTube" },
  { value: "manual", label: "マニュアル" },
  { value: "file", label: "ファイル" },
];

export default function RagAdminPage() {
  const { session, loading } = useSupabase();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "error">(
    "loading",
  );
  const [form, setForm] = useState({
    counselorId: "",
    title: "",
    sourceType: "youtube",
    sourceId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    let mounted = true;
    setFetchState("loading");

    Promise.all([
      loadCounselors(),
      fetch("/api/admin/rag", { cache: "no-store" }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load RAG documents");
        }
        return res.json();
      }),
    ])
      .then(([counselorList, ragData]) => {
        if (!mounted) return;
        setCounselors(counselorList);
        setDocuments(Array.isArray(ragData.documents) ? ragData.documents : []);
        setForm((prev) =>
          prev.counselorId || counselorList.length === 0
            ? prev
            : { ...prev, counselorId: counselorList[0].id },
        );
        setFetchState("idle");
      })
      .catch(() => {
        if (!mounted) return;
        setFetchState("error");
      });

    return () => {
      mounted = false;
    };
  }, [session]);

  const ragEnabledCount = useMemo(
    () => counselors.filter((c) => c.ragEnabled).length,
    [counselors],
  );

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.counselorId) {
      setMessage("カウンセラーを選択してください。");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "" }));
        throw new Error(error?.error ?? "アップロードに失敗しました");
      }

      const data = await response.json();
      if (data?.document) {
        setDocuments((prev) => [data.document, ...prev]);
        setMessage("RAGドキュメントを登録しました。");
        setForm((prev) => ({
          ...prev,
          title: "",
          sourceId: "",
        }));
      }
    } catch (error) {
      console.error(error);
      setMessage("登録処理でエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-500">
        セッション確認中...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-3xl bg-white/90 p-6 text-center text-slate-500">
        管理画面にアクセスするにはログインが必要です。
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              RAG Coverage
            </p>
            <h2 className="text-2xl font-bold text-slate-900">RAGデータ管理</h2>
            <p className="text-sm text-slate-500">
              チャンク化されたドキュメントを登録し、チャット応答の正確さを維持します。
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">RAG有効カウンセラー</p>
            <p className="text-3xl font-bold text-slate-900">
              {ragEnabledCount}
              <span className="ml-1 text-base text-slate-400">/ {counselors.length}</span>
            </p>
          </div>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              カウンセラー
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2"
                value={form.counselorId}
                onChange={(event) => handleChange("counselorId", event.target.value)}
              >
                <option value="">選択してください</option>
                {counselors.map((counselor) => (
                  <option key={counselor.id} value={counselor.id}>
                    {counselor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-600">
              ソース種別
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2"
                value={form.sourceType}
                onChange={(event) => handleChange("sourceType", event.target.value)}
              >
                {SOURCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-600">
            タイトル
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="例: 第3回テープ式心理学セミナー"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            ソースID / URL
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
              value={form.sourceId}
              onChange={(event) => handleChange("sourceId", event.target.value)}
              placeholder="YouTube動画IDやファイルパス"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <p className="flex-1">
              チャンク生成と埋め込みは `npm run rag:insert` スクリプトから実行してください。ここではメタデータのみを登録します。
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-blue-600 px-6 py-2 text-white shadow disabled:opacity-50"
            >
              {submitting ? "登録中..." : "登録"}
            </button>
          </div>
        </form>
        {message && (
          <p className="mt-3 text-sm text-slate-500">{message}</p>
        )}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              Active Sources
            </p>
            <h3 className="text-xl font-bold text-slate-900">登録済みドキュメント</h3>
          </div>
          <span className="text-sm text-slate-500">
            {documents.length} 件
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {fetchState === "loading" && (
            <p className="text-sm text-slate-500">読み込み中...</p>
          )}
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="rounded-2xl border border-slate-100 bg-white/80 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {doc.title ?? "タイトル未設定"}
                  </p>
                  <p className="text-xs text-slate-500">{doc.id}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {doc.source_type ?? "unknown"}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                <div>
                  <dt>カウンセラー</dt>
                  <dd className="font-semibold text-slate-800">
                    {doc.counselor_id}
                  </dd>
                </div>
                <div>
                  <dt>ソース</dt>
                  <dd className="break-all">{doc.source_id ?? "-"}</dd>
                </div>
                <div>
                  <dt>登録日</dt>
                  <dd>
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString("ja-JP")
                      : "--"}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
          {fetchState === "error" && (
            <p className="text-sm text-red-600">
              ドキュメント一覧を取得できませんでした。
            </p>
          )}
          {documents.length === 0 && fetchState === "idle" && (
            <p className="text-sm text-slate-500">
              まだ登録済みのRAGドキュメントがありません。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
