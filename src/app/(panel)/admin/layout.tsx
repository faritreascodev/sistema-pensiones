import type { ReactNode } from "react";
import { currentUser } from "@/server/current-user";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (user?.role !== "ADMIN") {
    return <p className="text-sm">Solo el administrador entra a esta sección.</p>;
  }
  return children;
}
