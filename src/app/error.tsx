"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Erro</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Algo saiu do esperado</h1>
            <p className="mt-3 text-sm text-slate-500">Não foi possível concluir a operação agora.</p>
            <button
              className="mt-6 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              onClick={reset}
              type="button"
            >
              Tentar novamente
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
