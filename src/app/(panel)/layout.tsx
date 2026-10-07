import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { currentUser } from "@/server/current-user";
import { prisma } from "@/server/db";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const year = await prisma.academicYear.findFirst({ where: { active: true } });
  if (!user) return null;
  return (
    <AppShell user={user} year={year?.name ?? "sin año activo"}>
      {children}
    </AppShell>
  );
}
