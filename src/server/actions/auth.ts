"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "../../lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "../../lib/auth/session";
import { loginSchema } from "../../lib/validations/forms";
import { writeAudit } from "../audit";
import { prisma } from "../db";

export async function loginAction(_state: { error: string } | null, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.active || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { error: "Correo o clave incorrectos, o el usuario está inactivo." };
  }

  (await cookies()).set(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
  await writeAudit(prisma, {
    actorId: user.id,
    action: "INGRESO",
    entity: "User",
    entityId: user.id,
    detail: user.email,
  });
  redirect("/caja");
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
