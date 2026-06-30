import fs from "node:fs";
import path from "node:path";
import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ManualMarkdown } from "@/components/manual-markdown";
import { requireGestorAdm } from "@/lib/auth";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractHeadings(markdown: string) {
  return markdown
    .split("\n")
    .flatMap((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (!match) {
        return [];
      }

      const level = match[1].length;
      const text = match[2].replace(/\[(.+?)\]\(.+?\)/g, "$1").trim();

      return [{ id: slugify(text), text, level }];
    })
    .filter((heading) => heading.text !== "Índice");
}

function readManual() {
  const manualPath = path.join(process.cwd(), "docs", "manual", "MANUAL_USUARIO.md");
  return fs.readFileSync(manualPath, "utf8");
}

export default async function ManualPage() {
  const { profile } = await requireGestorAdm();
  const content = readManual();
  const headings = extractHeadings(content);

  return (
    <AppShell subtitle="Manual" title="Manual do Usuário" userEmail={profile.email} userName={profile.nome}>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-6 py-8 text-white lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-blue-600">
                  <BookOpen className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-normal">Manual do Usuário</h1>
                    <span className="rounded-full border border-blue-300/40 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
                      v1.0
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Guia completo do CCB Patrimônio</p>
                </div>
              </div>
              <DownloadPdfButton />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Índice</p>
              <div className="mt-3 space-y-1">
                {headings.map((heading) => (
                  <a
                    className={`block rounded-md px-3 py-2 text-sm hover:bg-slate-50 hover:text-blue-700 ${
                      heading.level === 3 ? "ml-3 text-xs text-slate-500" : "font-medium text-slate-700"
                    }`}
                    href={`#${heading.id}`}
                    key={`${heading.id}-${heading.text}`}
                  >
                    {heading.text}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <article className="rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-sm lg:px-8">
            <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h1:text-3xl prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-a:text-blue-700 prose-img:my-6">
              <ManualMarkdown content={content} />
            </div>
          </article>
        </div>
      </div>
    </AppShell>
  );
}
