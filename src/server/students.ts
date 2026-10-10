import type { Prisma, Specialty, StudentStatus } from "@prisma/client";
import { displayName } from "../lib/domain/names";
import { pageBounds } from "../lib/domain/pagination";
import { specialtyLabel } from "../lib/domain/specialty";
import { writeAudit } from "./audit";
import type { SessionUser } from "./current-user";
import { prisma } from "./db";
import { AppError } from "./errors";

export type StudentInput = {
  id?: string;
  fullName: string;
  idCard: string;
  grade: string;
  section?: string;
  specialty: string;
  status: StudentStatus;
  academicYearId: string;
};

export async function listStudents(filters: {
  q?: string;
  grade?: string;
  section?: string;
  academicYearId?: string;
  page?: number;
  all?: boolean;
}) {
  const where: Prisma.StudentWhereInput = {
    ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
    ...(filters.q
      ? {
          OR: [
            { fullName: { contains: filters.q, mode: "insensitive" } },
            { idCard: { contains: filters.q } },
          ],
        }
      : {}),
    ...(filters.grade ? { grade: filters.grade } : {}),
    ...(filters.section ? { section: filters.section } : {}),
  };
  const total = await prisma.student.count({ where });
  const bounds = pageBounds(filters.page ?? 1, total);
  const rows = await prisma.student.findMany({
    where,
    orderBy: [{ grade: "asc" }, { section: "asc" }, { fullName: "asc" }],
    ...(filters.all ? {} : { skip: bounds.skip, take: bounds.take }),
  });
  return {
    total,
    page: bounds.page,
    pages: bounds.pages,
    from: bounds.from,
    to: bounds.to,
    rows: rows.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      idCard: student.idCard,
      grade: student.grade,
      section: student.section,
      specialty: specialtyLabel(student.specialty),
      status: student.status,
    })),
  };
}

export async function saveStudent(input: StudentInput, actor: SessionUser) {
  const year = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
  if (!year) throw new AppError("Elige un año lectivo.");
  const data = {
    fullName: displayName(input.fullName),
    idCard: input.idCard.trim() || null,
    grade: input.grade,
    section: input.section?.trim().toUpperCase() || null,
    specialty: (input.specialty || null) as Specialty | null,
    status: input.status,
    academicYearId: year.id,
  };
  if (data.idCard) {
    const clash = await prisma.student.findFirst({
      where: { idCard: data.idCard, NOT: input.id ? { id: input.id } : undefined },
    });
    if (clash) throw new AppError("Esa cédula ya pertenece a otro estudiante.");
  }
  const sameName = await prisma.student.findFirst({
    where: {
      fullName: data.fullName,
      grade: data.grade,
      section: data.section,
      academicYearId: data.academicYearId,
      NOT: input.id ? { id: input.id } : undefined,
    },
  });
  if (sameName) throw new AppError("Ese estudiante ya está matriculado en ese curso y paralelo.");

  const student = input.id
    ? await prisma.student.update({ where: { id: input.id }, data })
    : await prisma.student.create({ data });

  await writeAudit(prisma, {
    actorId: actor.id,
    action: input.id ? "EDITAR_ESTUDIANTE" : "CREAR_ESTUDIANTE",
    entity: "Student",
    entityId: student.id,
    detail: `${student.fullName} · ${student.grade}`,
  });
  return student.id;
}

export async function deleteStudent(id: string, actor: SessionUser) {
  const receipts = await prisma.receipt.count({ where: { studentId: id } });
  if (receipts > 0) throw new AppError("Tiene recibos. Actualízalo a Retirado en lugar de eliminarlo.");
  const student = await prisma.student.delete({ where: { id } });
  await writeAudit(prisma, {
    actorId: actor.id,
    action: "ELIMINAR_ESTUDIANTE",
    entity: "Student",
    entityId: id,
    detail: student.fullName,
  });
}
