import type { ReactNode } from "react";
import { AdminNav } from "@/components/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            Administration
          </p>
          <h1 className="text-3xl font-bold text-slate-900">管理ポータル</h1>
          <p className="text-sm text-slate-500">
            指標、カウンセラー設定、RAGデータを統合的に管理できます。
          </p>
        </header>
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
