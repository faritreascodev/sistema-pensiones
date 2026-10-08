import type { ReactNode } from "react";
import Link from "next/link";
import { pageWindow } from "@/lib/domain/pagination";

export function Pager({
  page,
  pages,
  total,
  from,
  to,
  href,
}: {
  page: number;
  pages: number;
  total: number;
  from: number;
  to: number;
  href: (page: number) => string;
}) {
  if (total === 0) return <p className="text-sm text-muted">Sin registros con este filtro.</p>;
  const numbers = pageWindow(page, pages);
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Páginas">
      <p className="text-muted">
        {from}–{to} de {total}
      </p>
      {pages > 1 ? (
        <div className="flex flex-wrap items-center gap-1">
          <PageLink href={page > 1 ? href(page - 1) : undefined}>Anterior</PageLink>
          {numbers.map((item, index) =>
            item === "…" ? (
              <span key={`gap-${index}`} className="px-1 text-muted">
                …
              </span>
            ) : (
              <PageLink key={item} href={href(item)} current={item === page}>
                {item}
              </PageLink>
            ),
          )}
          <PageLink href={page < pages ? href(page + 1) : undefined}>Siguiente</PageLink>
        </div>
      ) : null}
    </nav>
  );
}

function PageLink({ href, current, children }: { href?: string; current?: boolean; children: ReactNode }) {
  const className = current
    ? "inline-flex h-9 min-w-9 items-center justify-center rounded bg-pine px-2 font-semibold text-white"
    : "inline-flex h-9 min-w-9 items-center justify-center rounded border border-line bg-white px-2 text-ink";
  if (!href) return <span className={`${className} opacity-40`}>{children}</span>;
  return (
    <Link className={className} href={href} scroll={false}>
      {children}
    </Link>
  );
}
