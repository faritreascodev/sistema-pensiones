"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/server/actions/auth";
import { SCHOOL } from "@/lib/domain/school";
import { cn } from "@/lib/utils";

type User = { name: string; jobTitle: string; role: "ADMIN" | "COLLECTOR" };

const LINKS = [
  { href: "/caja", label: "Caja" },
  { href: "/estudiantes", label: "Estudiantes" },
  { href: "/vouchers", label: "Comprobantes" },
  { href: "/reportes", label: "Pagos" },
  { href: "/reportes/deudas", label: "Deudas" },
];

const ADMIN = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/anios", label: "Años lectivos" },
  { href: "/admin/auditoria", label: "Auditoría" },
];

export function AppShell({ user, year, children }: { user: User; year: string; children: ReactNode }) {
  const pathname = usePathname();
  const links = user.role === "ADMIN" ? [...LINKS, ...ADMIN] : LINKS;

  return (
    <div className="min-h-screen bg-paper">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-white lg:flex">
        <Link href="/caja" className="border-b border-white/15 px-4 py-4">
          <span className="block text-[11px] tracking-[0.14em] text-white/80 uppercase">{SCHOOL.institution}</span>
          <span className="mt-1 block font-serif text-lg leading-tight">{SCHOOL.name}</span>
        </Link>
        <p className="px-4 py-3 text-xs text-white/70">Año lectivo {year}</p>
        <nav className="flex-1 space-y-1 px-2">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/reportes" && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded px-3 py-2 text-sm",
                  active ? "bg-white/15 font-semibold" : "text-white/85 hover:bg-white/10",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/15 px-4 py-3 text-sm">
          <p className="font-semibold">{user.name}</p>
          <p className="text-xs text-white/70">{user.jobTitle}</p>
          <form action={logoutAction} className="mt-2">
            <button className="text-sm text-white underline-offset-2 hover:underline" type="submit">
              Salir
            </button>
          </form>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="no-print flex items-center justify-between bg-pine px-4 py-3 text-white lg:hidden">
          <Link href="/caja" className="font-serif">
            {SCHOOL.name}
          </Link>
          <form action={logoutAction}>
            <button type="submit">Salir</button>
          </form>
        </header>
        <nav className="no-print flex gap-1 overflow-x-auto bg-sidebar px-2 py-2 lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded px-3 py-1.5 text-sm whitespace-nowrap text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="px-4 py-5">{children}</main>
      </div>
    </div>
  );
}
