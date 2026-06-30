"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

const screenshotSizes: Record<string, { width: number; height: number }> = {
  "screenshots/01-dashboard.png": { width: 1440, height: 900 },
  "screenshots/02-rotinas.png": { width: 1440, height: 900 },
  "screenshots/03-movimentos.png": { width: 1440, height: 900 },
  "screenshots/04-formularios.png": { width: 1440, height: 900 },
  "screenshots/05-checklist.png": { width: 1440, height: 900 },
  "screenshots/06-pendencias.png": { width: 1440, height: 900 },
  "screenshots/07-inventario.png": { width: 1440, height: 900 },
  "screenshots/08-relatorios.png": { width: 1440, height: 900 },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function textFromChildren(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(textFromChildren).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return textFromChildren((children as { props?: { children?: React.ReactNode } }).props?.children);
  }

  return "";
}

export function ManualMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => {
          const text = textFromChildren(children);
          return <h1 id={slugify(text)}>{children}</h1>;
        },
        h2: ({ children }) => {
          const text = textFromChildren(children);
          return <h2 id={slugify(text)}>{children}</h2>;
        },
        h3: ({ children }) => {
          const text = textFromChildren(children);
          return <h3 id={slugify(text)}>{children}</h3>;
        },
        img: ({ src, alt }) => {
          const imageSrc = src?.startsWith("screenshots/") ? `/manual/${src}` : String(src ?? "");
          const size = src ? screenshotSizes[src] : null;

          return (
            <Image
              src={imageSrc}
              alt={alt ?? ""}
              width={size?.width ?? 1440}
              height={size?.height ?? 900}
              className="my-4 w-full rounded-lg border border-slate-200 shadow-md"
              sizes="(min-width: 1024px) 900px, calc(100vw - 2.5rem)"
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
