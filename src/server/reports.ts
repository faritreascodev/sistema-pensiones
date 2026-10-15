import type { PaymentMethod, Prisma } from "@prisma/client";
import { isoFromDate } from "../lib/domain/dates";
import { decimalToMoney } from "../lib/domain/money";
import { monthLabel } from "../lib/domain/months";
import { paymentLabel } from "../lib/domain/payments";
import { specialtyLabel } from "../lib/domain/specialty";
import { pensionKind } from "../lib/domain/fees";
import { nameKey } from "../lib/domain/names";
import { costaRows, debtCounts, foldPension, owesPension } from "../lib/domain/pension-account";
import { prisma } from "./db";

export async function collectionReport(filters: {
  from: string;
  to: string;
  cashierId?: string;
  includeVoided?: boolean;
  q?: string;
}) {
  const where: Prisma.ReceiptWhereInput = {
    issueDate: {
      gte: new Date(`${filters.from}T00:00:00.000Z`),
      lte: new Date(`${filters.to}T00:00:00.000Z`),
    },
    ...(filters.cashierId ? { cashierId: filters.cashierId } : {}),
    ...(filters.includeVoided ? {} : { status: "EMITTED" }),
    ...(filters.q
      ? {
          OR: [
            { student: { fullName: { contains: filters.q, mode: "insensitive" } } },
            { receiptNumber: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const receipts = await prisma.receipt.findMany({
    where,
    include: { student: true, fee: true },
    orderBy: [{ issueDate: "asc" }, { createdAt: "asc" }],
  });

  const totals: Record<PaymentMethod, number> = { CASH: 0, TRANSFER: 0, DEPOSIT: 0, CHECK: 0 };
  for (const receipt of receipts) {
    if (receipt.status !== "EMITTED") continue;
    totals[receipt.paymentMethod] += Math.round(Number(receipt.amount) * 100);
  }
  const money = (cents: number) => (cents / 100).toFixed(2);
  const bank = totals.TRANSFER + totals.DEPOSIT;

  return {
    totals: {
      cash: money(totals.CASH),
      bank: money(bank),
      transfer: money(totals.TRANSFER),
      deposit: money(totals.DEPOSIT),
      check: money(totals.CHECK),
      all: money(totals.CASH + bank + totals.CHECK),
    },
    rows: receipts.map((receipt) => ({
      id: receipt.id,
      fullName: receipt.student.fullName,
      grade: receipt.student.grade,
      section: receipt.student.section ?? "",
      specialty: specialtyLabel(receipt.student.specialty),
      receiptNumber: receipt.receiptNumber,
      issueDate: isoFromDate(receipt.issueDate),
      concept: receipt.fee.name,
      month: (receipt.coveredMonths?.length ? receipt.coveredMonths : [receipt.coveredMonth])
        .map((month) => monthLabel(month))
        .join(", "),
      amount: decimalToMoney(receipt.amount),
      method: paymentLabel(receipt.paymentMethod),
      methodCode: receipt.paymentMethod,
      reference: receipt.referenceNumber ?? "",
      cashierName: receipt.cashierName,
      cashierRole: receipt.cashierRole,
      status: receipt.status,
      notes: receipt.notes ?? "",
      voidReason: receipt.voidReason ?? "",
    })),
  };
}

export async function debtReport(academicYearId: string, grade?: string, q?: string) {
  const [students, receipts] = await Promise.all([
    prisma.student.findMany({
      where: {
        academicYearId,
        status: { not: "WITHDRAWN" },
        ...(grade ? { grade } : {}),
      },
      orderBy: [{ grade: "asc" }, { section: "asc" }, { fullName: "asc" }],
    }),
    prisma.receipt.findMany({
      where: { academicYearId, status: "EMITTED", fee: { category: "PENSION" } },
      include: { fee: true },
    }),
  ]);
  const byStudent = new Map<string, { kind: "FULL" | "PARTIAL"; months: string[]; cents: number }[]>();
  for (const receipt of receipts) {
    const kind = pensionKind(receipt.fee.category, receipt.fee.name);
    if (!kind) continue;
    const current = byStudent.get(receipt.studentId) ?? [];
    current.push({
      kind,
      months: receipt.coveredMonths?.length ? receipt.coveredMonths : [receipt.coveredMonth],
      cents: Math.round(Number(receipt.amount) * 100),
    });
    byStudent.set(receipt.studentId, current);
  }
  const needle = nameKey(q ?? "");
  const rows = students.flatMap((student) => {
    if (needle && !nameKey(student.fullName).includes(needle) && !(student.idCard && nameKey(student.idCard).includes(needle))) return [];
    const months = costaRows(foldPension(byStudent.get(student.id) ?? [])).map((row) => row.status);
    const counts = debtCounts(months);
    return [
      {
        id: student.id,
        fullName: student.fullName,
        grade: student.grade,
        section: student.section ?? "",
        specialty: specialtyLabel(student.specialty),
        months,
        ...counts,
      },
    ];
  });
  return {
    rows,
    pendingStudents: rows.filter((row) => row.pending > 0).length,
    clearStudents: rows.filter((row) => !owesPension(row.months)).length,
    debtors: rows.filter((row) => owesPension(row.months)),
  };
}
