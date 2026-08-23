export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded-full bg-[var(--surface-2)]" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-full bg-[var(--surface-2)]" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="hidden rounded-2xl border border-[var(--line)] bg-white p-3 lg:block">
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-lg bg-[var(--surface-2)]" />
            ))}
          </div>
        </div>
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
