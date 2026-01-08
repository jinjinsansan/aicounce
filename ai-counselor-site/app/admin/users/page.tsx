"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { CheckCircle2, XCircle } from "lucide-react";

type UserInfo = {
  id: string;
  email: string;
  username: string | null;
  registeredAt: string;
  lineLinked: boolean;
  chatCount: number;
  hasPayment: boolean;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
};

export default function AdminUsersPage() {
  const { session, loading } = useSupabase();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session) return;

    let mounted = true;
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        const data = await response.json();
        if (!mounted) return;
        setUsers(data.users);
      })
      .catch(() => {
        if (!mounted) return;
        setError("ユーザー一覧を取得できませんでした。");
      })
      .finally(() => mounted && setFetching(false));

    return () => {
      mounted = false;
    };
  }, [session]);

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(search.toLowerCase()))
  );

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
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Users
          </p>
          <h2 className="text-2xl font-bold text-slate-900">ユーザー一覧</h2>
          <p className="text-sm text-slate-500">
            全登録ユーザーの情報、LINE連携、決済状況を確認できます。
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{users.length.toLocaleString()}</p>
          <p className="text-xs text-slate-500">総ユーザー数</p>
        </div>
      </div>

      <div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="メールアドレスまたはユーザー名で検索"
          className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 py-3 font-semibold">メールアドレス</th>
              <th className="px-4 py-3 font-semibold">登録日</th>
              <th className="px-4 py-3 font-semibold">LINE連携</th>
              <th className="px-4 py-3 font-semibold">チャット数</th>
              <th className="px-4 py-3 font-semibold">決済</th>
              <th className="px-4 py-3 font-semibold">プラン</th>
              <th className="px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-b border-slate-50">
                  <td className="px-4 py-4">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-16 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-12 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-16 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-16 rounded bg-slate-200" />
                  </td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {search ? "検索結果がありません" : "ユーザーがいません"}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{user.email}</p>
                    {user.username && (
                      <p className="text-xs text-slate-500">{user.username}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {new Date(user.registeredAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-4">
                    {user.lineLinked ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-slate-300" />
                    )}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {user.chatCount}
                  </td>
                  <td className="px-4 py-4">
                    {user.hasPayment ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        決済済み
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {user.subscriptionPlan ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        {user.subscriptionPlan}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/chats?userId=${user.id}`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      履歴
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
