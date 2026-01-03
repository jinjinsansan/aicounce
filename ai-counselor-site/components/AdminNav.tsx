"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/counselors", label: "カウンセラー管理" },
  { href: "/admin/rag", label: "RAGデータ" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap gap-3">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
