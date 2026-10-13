import type { CalendarMonth, PaymentMethod, Prisma } from "@prisma/client";
import { monthLabel } from "../lib/domain/months";
import { decimalToMoney, normalizeMoney } from "../lib/domain/money";
import { needsBankDetail } from "../lib/domain/payments";
import { collidingMonths, costaRows, foldPension, fullMonths } from "../lib/domain/pension-account";
import { formatReceiptNumber, normalizeReceiptNumber } from "../lib/domain/receipt-number";
import { pensionKind } from "../lib/domain/fees";
import { specialtyLabel } from "../lib/domain/specialty";
import { asUtcDate } from "../lib/domain/dates";
import { writeAudit } from "./audit";
import { prisma } from "./db";
import { AppError } from "./errors";
import type { SessionUser } from "./current-user";

export type IssueInput = {
  studentId: string;
  academicYearId: string;
  feeCatalogId: string;
  coveredMonths: CalendarMonth[];
  amount: string;
  issueDate: string;
  receiptNumber?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  bankName?: string;
  bankDate?: string;
  cashierId: string;
  notes?: string;
};

export async function peekReceiptNumber(issueDate: string) {
  const year = Number(issueDate.slice(0, 4));
  const sequence = await prisma.receiptSequence.findUnique({ where: { year } });
  return formatReceiptNumber(year, (sequence?.lastNumber ?? 0) + 1);
}

export async function searchStudents(query: string, academicYearId?: string) {
  const term = query.trim();
  if (term.length < 2) return [];
  const students = await prisma.student.findMany({
    where: {
      ...(academicYearId ? { academicYearId } : {}),
      status: { not: "WITHDRAWN" },
      OR: [
        { fullName: { contains: term, mode: "insensitive" } },
        { idCard: { contains: term } },
      ],
    },
    orderBy: { fullName: "asc" },
    take: 12,
  });
  return students.map(presentStudent);
}

export async function studentsByCourse(academicYearId: string, grade: string, section?: string) {
  if (!grade) return [];
  const students = await prisma.student.findMany({
    where: {
      academicYearId,
      grade,
      status: { not: "WITHDRAWN" },
      ...(section ? { section } : {}),
    },
    orderBy: [{ section: "asc" }, { fullName: "asc" }],
  });
  return students.map(presentStudent);
}

export async function getStudentAccount(studentId: string, academicYearId?: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError("Estudiante no encontrado.");
  const yearId = academicYearId || student.academicYearId;
  const year = yearId
    ? await prisma.academicYear.findUnique({ where: { id: yearId } })
    : await prisma.academicYear.findFirst({ where: { active: true } });
  const receipts = await prisma.receipt.findMany({
    where: { studentId },
    include: { fee: true, academicYear: true },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
  });
  const pension = foldPension(
    receipts.flatMap((receipt) => {
      if (year && receipt.academicYearId !== year.id) return [];
      if (receipt.status !== "EMITTED") return [];
      const kind = pensionKind(receipt.fee.category, receipt.fee.name);
      if (!kind) return [];
      return [
        {
          kind,
          months: receipt.coveredMonths?.length ? receipt.coveredMonths : [receipt.coveredMonth],
          cents: Math.round(Number(receipt.amount) * 100),
        },
      ];
    }),
  );
  return {
    student: presentStudent(student),
    year: year ? { id: year.id, name: year.name } : null,
    months: costaRows(pension).map((row) => ({
      month: row.month,
      label: monthLabel(row.month),
      status: row.status,
      count: row.cents > 0 ? 1 : 0,
      total: (row.cents / 100).toFixed(2),
    })),
    receipts: receipts.map((receipt) => ({
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      issueDate: receipt.issueDate.toISOString().slice(0, 10),
      concept: receipt.fee.name,
      category: receipt.fee.category,
      month: (receipt.coveredMonths?.length ? receipt.coveredMonths : [receipt.coveredMonth])
        .map((month) => monthLabel(month))
        .join(", "),
      yearName: receipt.academicYear.name,
      amount: decimalToMoney(receipt.amount),
      method: receipt.paymentMethod,
      status: receipt.status,
      notes: receipt.notes,
      cashierName: receipt.cashierName,
    })),
  };
}

export async function issueReceipt(
  input: IssueInput,
  actor: SessionUser,
  voucher?: { buffer: Buffer; originalName: string },
) {
  const amount = normalizeMoney(input.amount);
  const manual = normalizeReceiptNumber(input.receiptNumber ?? "");
  const months = [...new Set(input.coveredMonths)];
  if (!months.length) throw new AppError("Elige al menos un mes.");
  const bank = needsBankDetail(input.paymentMethod);
  if (bank && !voucher) throw new AppError("Adjunta el comprobante de la transferencia.");

  const stored = voucher ? await import("./files").then((files) => files.storeVoucher(voucher.buffer)) : null;

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM students WHERE id = ${input.studentId}::uuid FOR UPDATE`;
      const student = await tx.student.findUnique({ where: { id: input.studentId } });
      if (!student || student.status === "WITHDRAWN") throw new AppError("El estudiante no está habilitado para cobro.");
      const fee = await tx.feeCatalog.findFirst({ where: { id: input.feeCatalogId, active: true } });
      if (!fee) throw new AppError("El concepto no está activo.");
      const year = await tx.academicYear.findUnique({ where: { id: input.academicYearId } });
      if (!year) throw new AppError("Elige un año lectivo.");
      const kind = pensionKind(fee.category, fee.name);
      if (kind) {
        const previous = await tx.receipt.findMany({
          where: {
            studentId: student.id,
            academicYearId: year.id,
            status: "EMITTED",
            fee: { category: "PENSION" },
          },
          include: { fee: true },
        });
        const blocked = fullMonths(
          previous.map((receipt) => ({
            kind: pensionKind(receipt.fee.category, receipt.fee.name),
            months: receipt.coveredMonths?.length ? receipt.coveredMonths : [receipt.coveredMonth],
          })),
        );
        const clash = collidingMonths(months, blocked).map((month) => monthLabel(month as CalendarMonth));
        if (clash.length) {
          throw new AppError(`Ya está pagada la pensión de ${clash.join(", ")}.`);
        }
      }

      const cashier = await tx.user.findFirst({ where: { id: input.cashierId, active: true } });
      if (!cashier) throw new AppError("La colectora en turno no está activa.");
      if (actor.role !== "ADMIN" && cashier.id !== actor.id) {
        throw new AppError("Solo puedes emitir a tu nombre.");
      }

      const receiptNumber = manual || (await allocateNumber(tx, Number(input.issueDate.slice(0, 4))));
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          issueDate: asUtcDate(input.issueDate),
          studentId: student.id,
          academicYearId: year.id,
          feeCatalogId: fee.id,
          coveredMonth: months[0],
          coveredMonths: months,
          amount,
          paymentMethod: input.paymentMethod,
          referenceNumber: bank ? input.referenceNumber!.trim() : null,
          bankName: bank ? input.bankName!.trim() : null,
          bankDate: bank && input.bankDate ? asUtcDate(input.bankDate) : null,
          cashierId: cashier.id,
          cashierName: cashier.name,
          cashierRole: cashier.jobTitle,
          notes: input.notes?.trim() || null,
        },
        include: { fee: true, student: true },
      });

      if (stored && voucher) {
        await tx.paymentVoucher.create({
          data: {
            receiptId: receipt.id,
            studentId: student.id,
            storedName: stored.storedName,
            originalName: voucher.originalName.slice(0, 120),
            mimeType: stored.mimeType,
            bankName: input.bankName!.trim(),
            referenceNumber: input.referenceNumber!.trim(),
            amount,
            bankDate: input.bankDate ? asUtcDate(input.bankDate) : null,
          },
        });
      }

      await writeAudit(tx, {
        actorId: actor.id,
        action: "EMITIR",
        entity: "Receipt",
        entityId: receipt.id,
        detail: `${receiptNumber} · ${student.fullName} · ${fee.name} · ${amount}`,
      });

      return {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        issueDate: input.issueDate,
        amount,
        concept: fee.name,
        month: months.map((month) => monthLabel(month)).join(", "),
        method: input.paymentMethod,
        referenceNumber: receipt.referenceNumber,
        bankName: receipt.bankName,
        notes: receipt.notes,
        studentName: student.fullName,
        grade: student.grade,
        section: student.section,
        specialty: specialtyLabel(student.specialty),
        cashierName: cashier.name,
        cashierRole: cashier.jobTitle,
        yearName: year.name,
      };
    });
  } catch (error) {
    if (stored) {
      const { removeVoucher } = await import("./files");
      await removeVoucher(stored.storedName);
    }
    throw error;
  }
}

async function allocateNumber(tx: Prisma.TransactionClient, year: number) {
  const sequence = await tx.receiptSequence.upsert({
    where: { year },
    create: { year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatReceiptNumber(year, sequence.lastNumber);
}

export async function voidReceipt(actor: SessionUser, reason: string, receiptId?: string) {
  const trimmed = reason.trim();
  if (trimmed.length < 10) throw new AppError("El motivo necesita al menos 10 caracteres.");

  return prisma.$transaction(async (tx) => {
    const rows = receiptId
      ? await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM receipts WHERE id = ${receiptId}::uuid AND status = 'EMITTED' FOR UPDATE
        `
      : actor.role === "ADMIN"
        ? await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM receipts WHERE status = 'EMITTED' ORDER BY "createdAt" DESC LIMIT 1 FOR UPDATE
          `
        : await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM receipts
            WHERE status = 'EMITTED' AND "cashierId" = ${actor.id}::uuid
            ORDER BY "createdAt" DESC LIMIT 1 FOR UPDATE
          `;

    const id = rows[0]?.id;
    if (!id) throw new AppError("No hay un recibo emitido para anular.");
    if (receiptId && actor.role !== "ADMIN") {
      throw new AppError("Solo el administrador anula un recibo que no sea el último propio.");
    }

    const receipt = await tx.receipt.findUnique({ where: { id }, include: { student: true } });
    if (!receipt || receipt.status !== "EMITTED") throw new AppError("Ese recibo ya no está emitido.");
    if (!receiptId && actor.role !== "ADMIN" && receipt.cashierId !== actor.id) {
      throw new AppError("Solo puedes anular tu último recibo.");
    }

    await tx.receipt.update({
      where: { id },
      data: {
        status: "VOIDED",
        voidReason: trimmed,
        voidedAt: new Date(),
        voidedById: actor.id,
      },
    });
    await tx.paymentVoucher.updateMany({
      where: { receiptId: id, verificationStatus: "PENDING" },
      data: { verificationStatus: "REJECTED", reviewNote: "Recibo anulado", reviewedAt: new Date(), reviewedById: actor.id },
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "ANULAR",
      entity: "Receipt",
      entityId: id,
      detail: `${receipt.receiptNumber} · ${receipt.student.fullName} · ${trimmed}`,
    });
    return { id, receiptNumber: receipt.receiptNumber };
  });
}

function presentStudent(student: {
  id: string;
  fullName: string;
  idCard: string | null;
  grade: string;
  section: string | null;
  specialty: import("@prisma/client").Specialty | null;
  status: import("@prisma/client").StudentStatus;
  academicYearId: string | null;
}) {
  return {
    id: student.id,
    fullName: student.fullName,
    idCard: student.idCard,
    grade: student.grade,
    section: student.section,
    specialty: student.specialty,
    specialtyLabel: specialtyLabel(student.specialty),
    status: student.status,
    academicYearId: student.academicYearId,
  };
}
