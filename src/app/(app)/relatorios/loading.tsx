export default function RelatoriosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-10 w-28 rounded-md bg-slate-200" key={index} />
        ))}
      </div>
      <div className="h-96 rounded-lg bg-slate-200" />
    </div>
  );
}
