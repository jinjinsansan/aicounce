"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  const codeHandled = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageVariant, setMessageVariant] = useState<"info" | "error" | "success">("info");
  const [processingCode, setProcessingCode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (session && !recoveryMode) {
      router.replace(redirectTo);
    }
  }, [session, redirectTo, router, recoveryMode]);

  const switchToReset = () => {
    setMode("reset");
    setMessage(null);
    setPassword("");
  };

  const switchToLogin = () => {
    setMode("login");
    setMessage(null);
  };

  useEffect(() => {
    if (!searchParams || codeHandled.current) return;
    const code = searchParams.get("code");
    if (!code) return;

    codeHandled.current = true;
    const type = searchParams.get("type");
    setProcessingCode(true);
    setMessage(null);
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      setProcessingCode(false);
      if (error) {
        setMessageVariant("error");
        setMessage("メールリンクの検証に失敗しました。もう一度お試しください。");
        return;
      }

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.delete("code");
        params.delete("type");
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
      }

      if (type === "recovery") {
        setRecoveryMode(true);
        setMode("login");
        setMessageVariant("info");
        setMessage("新しいパスワードを設定してください。");
      } else {
        setMessageVariant("success");
        setMessage("メール認証が完了しました。ログインを続行できます。");
      }
    })().catch((exchangeError) => {
      console.error("exchange code error", exchangeError);
      setProcessingCode(false);
      setMessageVariant("error");
      setMessage("メールリンクの処理に失敗しました。時間を置いて再度お試しください。");
    });
  }, [searchParams, supabase]);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessageVariant("error");
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
        setMessageVariant("error");
        setMessage(payload.error ?? "サインアップに失敗しました");
      } else {
        setMessageVariant("success");
        setMessage("確認メールを送信しました。メールのリンクから登録を完了してください。");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("signup request failed", error);
      }
      setMessageVariant("error");
      setMessage("サインアップに失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setMessageVariant("error");
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
        setMessageVariant("error");
        setMessage(payload.error ?? "パスワード再設定に失敗しました");
      } else {
        setMessageVariant("success");
        setMessage("パスワード再設定メールを送信しました");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("password reset request failed", error);
      }
      setMessageVariant("error");
      setMessage("パスワード再設定に失敗しました");
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (isUpdatingPassword) return;
    if (newPassword.length < 8) {
      setMessageVariant("error");
      setMessage("パスワードは8文字以上にしてください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessageVariant("error");
      setMessage("パスワードが一致しません");
      return;
    }

    setIsUpdatingPassword(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);
    if (error) {
      setMessageVariant("error");
      setMessage(error.message ?? "パスワードの更新に失敗しました");
      return;
    }

    setMessageVariant("success");
    setMessage("パスワードを更新しました。ログイン処理を続行します。");
    setRecoveryMode(false);
    setNewPassword("");
    setConfirmPassword("");
    router.replace(redirectTo);
    router.refresh();
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
          {recoveryMode
            ? "メールからのリンクを確認しました。新しいパスワードを設定してください。"
            : mode === "reset"
              ? "パスワード再設定用のメールを送信します。"
              : "メールアドレスとパスワードでサインインしてください。"}
        </p>

        {processingCode && (
          <p className="mt-4 text-sm text-slate-500">メールリンクを検証しています...</p>
        )}

        {message && (
          <p
            className={`mt-4 text-sm ${
              messageVariant === "success"
                ? "text-emerald-600"
                : messageVariant === "info"
                  ? "text-slate-600"
                  : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        {recoveryMode ? (
          <>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                新しいパスワード
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                  placeholder="••••••••"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                新しいパスワード（確認）
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
                  placeholder="••••••••"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
                className="rounded-2xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-70"
              >
                {isUpdatingPassword ? "更新中..." : "パスワードを更新"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryMode(false);
                  setMessage(null);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-sm font-semibold text-slate-500 underline-offset-4 hover:text-slate-700"
              >
                キャンセルしてログイン画面に戻る
              </button>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
