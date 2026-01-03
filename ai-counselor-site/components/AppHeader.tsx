"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useChatStore } from "@/store/chatStore";

const baseNavLinks = [
  { href: "/", label: "ホーム" },
  { href: "/counselor/michele", label: "カウンセラー" },
];
export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, supabase, loading } = useSupabase();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      useChatStore.getState().setMessages([]);
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const navLinks = session
    ? [...baseNavLinks, { href: "/admin", label: "管理" }]
    : baseNavLinks;

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span>AIカウンセリング事務所</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "text-blue-600" : "hover:text-slate-900"}
              >
                {link.label}
              </Link>
            );
          })}
          {loading ? null : session ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-full bg-slate-900 px-4 py-2 text-white"
            >
              {isSigningOut ? "サインアウト中..." : "サインアウト"}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-900 hover:border-slate-300"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
