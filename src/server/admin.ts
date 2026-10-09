import type { FeeCategory, Prisma, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { normalizeFeeName } from "../lib/domain/fees";
import { normalizeMoney } from "../lib/domain/money";
import { span } from "../lib/domain/school-year";
import { writeAudit } from "./audit";
import type { SessionUser } from "./current-user";
import { prisma } from "./db";
import { AppError } from "./errors";

export async function saveUser(
  input: {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    jobTitle: string;
    active: boolean;
  },
  actor: SessionUser,
) {
  const email = input.email.trim().toLowerCase();
  const clash = await prisma.user.findFirst({
    where: { email, NOT: input.id ? { id: input.id } : undefined },
  });
  if (clash) throw new AppError("Ese correo ya está registrado.");
  if (!input.id && !input.password) throw new AppError("Define una clave inicial.");
  if (input.id === actor.id && !input.active) throw new AppError("No puedes desactivar tu propio usuario.");

  if (input.id && input.role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN", active: true, NOT: { id: input.id } } });
    if (admins === 0) throw new AppError("Debe quedar al menos un administrador activo.");
  }

  const data: Prisma.UserUpdateInput = {
    name: input.name.trim(),
    email,
    role: input.role,
    jobTitle: input.jobTitle.trim(),
    active: input.active,
    ...(input.password ? { passwordHash: hashPassword(input.password) } : {}),
  };

  const user = input.id
    ? await prisma.user.update({ where: { id: input.id }, data })
    : await prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          role: input.role,
          jobTitle: input.jobTitle.trim(),
          active: input.active,
          passwordHash: hashPassword(input.password!),
        },
      });

  await writeAudit(prisma, {
    actorId: actor.id,
    action: input.id ? "EDITAR_USUARIO" : "CREAR_USUARIO",
    entity: "User",
    entityId: user.id,
    detail: `${user.name} · ${user.role} · ${user.active ? "activo" : "inactivo"}`,
  });
}

export async function deleteUser(id: string, actor: SessionUser) {
  if (id === actor.id) throw new AppError("No puedes eliminar tu propio usuario.");
  const receipts = await prisma.receipt.count({ where: { OR: [{ cashierId: id }, { voidedById: id }] } });
  if (receipts > 0) throw new AppError("Ese usuario tiene recibos. Desactívalo en lugar de eliminarlo.");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("Usuario no encontrado.");
  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN", active: true, NOT: { id } } });
    if (admins === 0) throw new AppError("Debe quedar al menos un administrador.");
  }
  await prisma.user.delete({ where: { id } });
  await writeAudit(prisma, { actorId: actor.id, action: "ELIMINAR_USUARIO", entity: "User", entityId: id, detail: user.name });
}

export async function deleteFee(id: string, actor: SessionUser) {
  const receipts = await prisma.receipt.count({ where: { feeCatalogId: id } });
  if (receipts > 0) throw new AppError("Ese concepto ya tiene recibos. Desactívalo en lugar de eliminarlo.");
  const fee = await prisma.feeCatalog.delete({ where: { id } });
  await writeAudit(prisma, { actorId: actor.id, action: "ELIMINAR_CONCEPTO", entity: "FeeCatalog", entityId: id, detail: fee.name });
}

export async function deleteSchoolYear(id: string, actor: SessionUser) {
  const [receipts, students] = await Promise.all([
    prisma.receipt.count({ where: { academicYearId: id } }),
    prisma.student.count({ where: { academicYearId: id } }),
  ]);
  if (receipts || students) throw new AppError("Ese lectivo tiene estudiantes o recibos. No se puede eliminar.");
  const year = await prisma.academicYear.delete({ where: { id } });
  await writeAudit(prisma, { actorId: actor.id, action: "ELIMINAR_LECTIVO", entity: "AcademicYear", entityId: id, detail: year.name });
}

export async function saveFee(
  input: { id?: string; name: string; category: FeeCategory; baseAmount: string; active: boolean },
  actor: SessionUser,
) {
  const name = normalizeFeeName(input.name);
  const clash = await prisma.feeCatalog.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, NOT: input.id ? { id: input.id } : undefined },
  });
  if (clash) throw new AppError("Ese concepto ya existe.");
  const baseAmount = input.baseAmount ? normalizeMoney(input.baseAmount) : null;
  const fee = input.id
    ? await prisma.feeCatalog.update({
        where: { id: input.id },
        data: { name, category: input.category, baseAmount, active: input.active },
      })
    : await prisma.feeCatalog.create({
        data: { name, category: input.category, baseAmount, active: input.active, sortOrder: 200 },
      });
  await writeAudit(prisma, {
    actorId: actor.id,
    action: input.id ? "EDITAR_CONCEPTO" : "CREAR_CONCEPTO",
    entity: "FeeCatalog",
    entityId: fee.id,
    detail: fee.name,
  });
}

export async function openSchoolYear(startYear: number, actor: SessionUser) {
  const next = span(startYear);
  const existing = await prisma.academicYear.findUnique({ where: { name: next.name } });
  if (existing) throw new AppError(`El lectivo ${next.name} ya existe.`);
  const year = await prisma.academicYear.create({
    data: {
      name: next.name,
      startYear: next.startYear,
      endYear: next.endYear,
      startsOn: new Date(`${next.startsOn}T00:00:00.000Z`),
      endsOn: new Date(`${next.endsOn}T00:00:00.000Z`),
      active: false,
    },
  });
  await writeAudit(prisma, {
    actorId: actor.id,
    action: "ABRIR_LECTIVO",
    entity: "AcademicYear",
    entityId: year.id,
    detail: year.name,
  });
}

export async function activateSchoolYear(id: string, actor: SessionUser) {
  await prisma.$transaction(async (tx) => {
    await tx.academicYear.updateMany({ data: { active: false } });
    const year = await tx.academicYear.update({ where: { id }, data: { active: true } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "ACTIVAR_LECTIVO",
      entity: "AcademicYear",
      entityId: id,
      detail: year.name,
    });
  });
}

export async function reviewVoucher(
  input: { voucherId: string; status: "APPROVED" | "REJECTED"; note?: string },
  actor: SessionUser,
) {
  const voucher = await prisma.paymentVoucher.update({
    where: { id: input.voucherId },
    data: {
      verificationStatus: input.status,
      reviewNote: input.note?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: actor.id,
    },
  });
  await writeAudit(prisma, {
    actorId: actor.id,
    action: input.status === "APPROVED" ? "APROBAR_VOUCHER" : "RECHAZAR_VOUCHER",
    entity: "PaymentVoucher",
    entityId: voucher.id,
    detail: `${voucher.referenceNumber} · ${voucher.bankName}`,
  });
}
