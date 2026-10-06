import { cookies } from "next/headers";
import { readSessionUserId, SESSION_COOKIE } from "../lib/auth/session";
import { prisma } from "./db";
import { AppError } from "./errors";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "COLLECTOR";
  jobTitle: string;
};

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = readSessionUserId(token);
  if (!userId) return null;
  const user = await prisma.user.findFirst({
    where: { id: userId, active: true },
    select: { id: true, name: true, email: true, role: true, jobTitle: true },
  });
  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new AppError("La sesión expiró. Vuelve a entrar.");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AppError("Solo el administrador puede hacer esto.");
  return user;
}
