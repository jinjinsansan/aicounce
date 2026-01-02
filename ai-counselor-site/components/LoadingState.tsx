export function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`counselor-skeleton-${index}`}
          className="animate-pulse rounded-3xl border border-slate-100 bg-white/60 p-6 shadow-sm"
        >
          <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-200" />
          <div className="mb-2 h-5 w-2/3 rounded-full bg-slate-200" />
          <div className="mb-6 h-4 w-1/2 rounded-full bg-slate-100" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-100" />
            <div className="h-3 w-5/6 rounded-full bg-slate-100" />
            <div className="h-3 w-2/3 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
