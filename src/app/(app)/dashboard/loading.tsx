export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-lg bg-slate-200" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="h-32 rounded-lg bg-slate-200" key={index} />
        ))}
      </section>
      <div className="h-72 rounded-lg bg-slate-200" />
    </div>
  );
}
