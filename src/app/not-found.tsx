import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Página não encontrada</h1>
        <p className="mt-3 text-sm text-slate-500">O endereço acessado não existe ou foi movido.</p>
        <Link
          className="mt-6 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          href="/dashboard"
        >
          Voltar ao dashboard
        </Link>
      </section>
    </main>
  );
}
