"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/providers/SupabaseProvider";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="text-sm text-slate-600">読み込み中...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const { session, supabase, loading } = useSupabase();

  useEffect(() => {
    if (session) {
      router.replace(redirectTo);
    }
  }, [session, redirectTo, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  };

  const handleSignUp = async () => {
    setIsSubmitting(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
      },
    });
    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }
    setMessage("確認メールを送信しました。メールのリンクから再度ログインしてください。");
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-sm text-slate-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">ログイン / 新規登録</h1>
        <p className="mt-2 text-sm text-slate-600">
          メールアドレスとパスワードでサインインしてください。
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            パスワード
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
              placeholder="••••••••"
            />
          </label>
        </div>

        {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSubmitting}
            className="rounded-2xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-70"
          >
            {isSubmitting ? "処理中..." : "ログイン"}
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold text-slate-800"
          >
            新規登録
          </button>
        </div>
      </div>
    </div>
  );
}
