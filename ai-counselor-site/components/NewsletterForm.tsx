"use client";

import { useState, type FormEvent } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setMessage("メールアドレスを入力してください");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "登録に失敗しました");
      } else {
        setStatus("success");
        setMessage("ご登録ありがとうございます。メールをご確認ください。");
        setEmail("");
      }
    } catch (error) {
      console.error("newsletter subscribe failed", error);
      setStatus("error");
      setMessage("登録に失敗しました");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="text-sm font-semibold text-slate-600">ニュースレターを受け取る</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          aria-label="メールアドレス"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
        >
          {status === "loading" ? "登録中..." : "登録"}
        </button>
      </div>
      {message && (
        <p className={`text-xs ${status === "error" ? "text-red-500" : "text-slate-600"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
