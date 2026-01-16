"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function EmotionDiaryBanner() {
  return (
    <section className="px-2 sm:px-4 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-100">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-rose-100/80 via-amber-50 to-sky-100/80" aria-hidden="true" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-md shadow-rose-100">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="space-y-2 text-slate-900">
              <p className="text-base font-semibold">
                ミシェルAIは「かんじょうにっき」サイトでもお使いいただけます。
              </p>
              <p className="text-sm text-slate-600">
                かんじょうにっきサイトはこちら：
                <span className="ml-1 font-medium text-rose-500">https://namisapo.app/</span>
              </p>
            </div>
          </div>
          <div>
            <Link
              href="https://namisapo.app/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-black"
            >
              かんじょうにっきサイトへ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
