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

type Mode = "login" | "reset";

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
  const [mode, setMode] = useState<Mode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const switchToReset = () => {
    setMode("reset");
    setMessage(null);
    setPassword("");
  };

  const switchToLogin = () => {
    setMode("login");
    setMessage(null);
  };

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
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "サインアップに失敗しました");
      } else {
        setMessage("確認メールを送信しました。メールのリンクから登録を完了してください。");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("signup request failed", error);
      }
      setMessage("サインアップに失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setMessage("パスワード再設定にはメールアドレスが必要です");
      return;
    }
    setIsResetting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "パスワード再設定に失敗しました");
      } else {
        setMessage("パスワード再設定メールを送信しました");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("password reset request failed", error);
      }
      setMessage("パスワード再設定に失敗しました");
    } finally {
      setIsResetting(false);
    }
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
          {mode === "reset" ? "パスワード再設定用のメールを送信します。" : "メールアドレスとパスワードでサインインしてください。"}
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

          {mode === "login" && (
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
          )}
        </div>

        {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

        <div className="mt-6 flex flex-col gap-3">
          {mode === "login" ? (
            <>
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
              <button
                type="button"
                onClick={switchToReset}
                className="text-sm font-semibold text-slate-500 underline-offset-4 hover:text-slate-700"
              >
                パスワードをお忘れですか？
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResetting || !email.trim()}
                className="rounded-2xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-70"
              >
                {isResetting ? "送信中..." : "再設定メールを送信"}
              </button>
              <button
                type="button"
                onClick={switchToLogin}
                className="text-sm font-semibold text-slate-500 underline-offset-4 hover:text-slate-700"
              >
                戻る
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
