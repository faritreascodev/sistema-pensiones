import ExcelJS from "exceljs";
import type { PaymentMethod, Specialty } from "@prisma/client";
import { canonicalGrade, canonicalSection } from "../lib/domain/grades";
import { monthFromSpanish } from "../lib/domain/months";
import { displayName, nameKey } from "../lib/domain/names";
import { paymentFromSpanish } from "../lib/domain/payments";
import { normalizeFeeName } from "../lib/domain/fees";
import { canonicalSpecialty } from "../lib/domain/specialty";
import { schoolYearForDate } from "../lib/domain/school-year";
import { prisma } from "./db";

type StudentRow = {
  fullName: string;
  grade: string;
  section: string | null;
  specialty: Specialty | null;
};

type ReceiptRow = {
  fullName: string;
  grade: string;
  section: string | null;
  specialty: Specialty | null;
  receiptNumber: string;
  issueDate: string;
  concept: string;
  month: NonNullable<ReturnType<typeof monthFromSpanish>>;
  amount: string;
  method: PaymentMethod;
  reference: string | null;
  cashierName: string;
  cashierRole: string;
};

function textOf(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("result" in value) return textOf(value.result as ExcelJS.CellValue);
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
  }
  return String(value).trim();
}

function sheetRows(sheet: ExcelJS.Worksheet) {
  const rows: string[][] = [];
  const width = Math.max(sheet.columnCount, 20);
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const line: string[] = [];
    for (let column = 1; column <= width; column += 1) {
      line.push(textOf(row.getCell(column).value));
    }
    rows.push(line);
  });
  return rows;
}

function findHeader(rows: string[][], marker: string) {
  return rows.findIndex((row) => row.some((cell) => cell.toLowerCase().includes(marker)));
}

function column(header: string[], names: string[]) {
  const index = header.findIndex((cell) => names.some((name) => (cell ?? "").toLowerCase().includes(name)));
  return index;
}

export async function readWorkbook(source: string | Buffer) {
  const workbook = new ExcelJS.Workbook();
  if (typeof source === "string") await workbook.xlsx.readFile(source);
  else await workbook.xlsx.load(source as unknown as ExcelJS.Buffer);
  return workbook;
}

export function studentsFromWorkbook(workbook: ExcelJS.Workbook): StudentRow[] {
  const sheet =
    workbook.getWorksheet("BD Estudiantes") ??
    workbook.worksheets.find((item) => item.name.toLowerCase().includes("estudiante")) ??
    workbook.worksheets[0];
  if (!sheet) return [];
  const rows = sheetRows(sheet);
  const headerIndex = findHeader(rows, "apellido");
  if (headerIndex < 0) return [];
  const header = rows[headerIndex];
  const name = column(header, ["apellido"]);
  const grade = column(header, ["curso", "grado"]);
  const section = column(header, ["paralelo"]);
  const specialty = column(header, ["especialidad"]);
  const parsed: StudentRow[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const fullName = displayName(row[name] ?? "");
    if (fullName.length < 5 || fullName.includes("#")) continue;
    parsed.push({
      fullName,
      grade: canonicalGrade(row[grade] ?? "") ?? (row[grade]?.trim() || "Sin curso"),
      section: canonicalSection(row[section]),
      specialty: canonicalSpecialty(row[specialty]),
    });
  }
  return parsed;
}

export function receiptsFromWorkbook(workbook: ExcelJS.Workbook): ReceiptRow[] {
  const sheet = workbook.getWorksheet("BD Registros Recibo") ?? workbook.worksheets.find((item) => item.name.toLowerCase().includes("registro"));
  if (!sheet) return [];
  const rows = sheetRows(sheet);
  const headerIndex = findHeader(rows, "apellido");
  if (headerIndex < 0) return [];
  const header = rows[headerIndex];
  const name = column(header, ["apellido"]);
  const grade = column(header, ["curso"]);
  const section = column(header, ["paralelo"]);
  const specialty = column(header, ["especialidad"]);
  const number = column(header, ["recibo"]);
  const date = column(header, ["fecha"]);
  const concept = column(header, ["concepto"]);
  const month = column(header, ["mes"]);
  const amount = column(header, ["cantidad"]);
  const method = column(header, ["forma"]);
  const reference = column(header, ["cheque"]);
  const cashier = column(header, ["atencion", "atención"]);
  const role = column(header, ["cargo"]);
  const parsed: ReceiptRow[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const fullName = displayName(row[name] ?? "");
    const issueDate = row[date] ?? "";
    const covered = monthFromSpanish(row[month] ?? "");
    const rawAmount = Number(String(row[amount] ?? "").replace(",", "."));
    if (fullName.length < 5 || !/^\d{4}-\d{2}-\d{2}$/.test(issueDate) || !covered || !Number.isFinite(rawAmount) || rawAmount <= 0) {
      continue;
    }
    const payment = paymentFromSpanish(row[method] ?? "") ?? "CASH";
    const ref = (row[reference] ?? "").trim();
    parsed.push({
      fullName,
      grade: canonicalGrade(row[grade] ?? "") ?? (row[grade]?.trim() || "Sin curso"),
      section: canonicalSection(row[section]),
      specialty: canonicalSpecialty(row[specialty]),
      receiptNumber: (row[number] ?? "").replace(/\s+/g, " ").trim().slice(0, 40) || "S/N",
      issueDate,
      concept: normalizeFeeName(row[concept] ?? "") || "Pension",
      month: covered,
      amount: rawAmount.toFixed(2),
      method: payment,
      reference: payment === "CASH" ? null : ref.length >= 4 ? ref.slice(0, 40) : "HISTORICO",
      cashierName: (row[cashier] ?? "").trim() || "Nubia Loor",
      cashierRole: (row[role] ?? "").trim() || "Colectora",
    });
  }
  return parsed;
}

export async function importStudents(rows: StudentRow[], academicYearId: string) {
  const existing = await prisma.student.findMany({ select: { id: true, fullName: true, grade: true, section: true } });
  const known = new Set(existing.map((student) => `${nameKey(student.fullName)}|${student.grade}|${student.section ?? ""}`));
  const fresh = rows.filter((row) => !known.has(`${nameKey(row.fullName)}|${row.grade}|${row.section ?? ""}`));
  const grades = [...new Set(fresh.map((row) => row.grade))];
  for (const [index, name] of grades.entries()) {
    await prisma.grade.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: 100 + index },
    });
  }
  if (fresh.length) {
    await prisma.student.createMany({
      data: fresh.map((row) => ({
        fullName: row.fullName,
        grade: row.grade,
        section: row.section,
        specialty: row.specialty,
        academicYearId,
        status: "ACTIVE" as const,
      })),
    });
  }
  return { inserted: fresh.length, skipped: rows.length - fresh.length };
}

export async function importHistoricalReceipts(rows: ReceiptRow[], fallbackCashierId: string) {
  const [students, fees, years, users] = await Promise.all([
    prisma.student.findMany(),
    prisma.feeCatalog.findMany(),
    prisma.academicYear.findMany(),
    prisma.user.findMany(),
  ]);
  const byName = new Map<string, typeof students>();
  for (const student of students) {
    const key = nameKey(student.fullName);
    byName.set(key, [...(byName.get(key) ?? []), student]);
  }
  const feeByName = new Map(fees.map((fee) => [nameKey(fee.name), fee]));
  const yearByName = new Map(years.map((year) => [year.name, year]));
  const userByName = new Map(users.map((user) => [nameKey(user.name), user]));

  let inserted = 0;
  const pending: {
    receiptNumber: string;
    issueDate: Date;
    studentId: string;
    academicYearId: string;
    feeCatalogId: string;
    coveredMonth: ReceiptRow["month"];
    coveredMonths: ReceiptRow["month"][];
    amount: string;
    paymentMethod: PaymentMethod;
    referenceNumber: string | null;
    cashierId: string;
    cashierName: string;
    cashierRole: string;
  }[] = [];

  for (const row of rows) {
    const matches = byName.get(nameKey(row.fullName)) ?? [];
    let student = matches.find((item) => item.grade === row.grade) ?? matches[0];
    if (!student) {
      const active = years.find((year) => year.active) ?? years[0];
      if (!active) continue;
      student = await prisma.student.create({
        data: {
          fullName: row.fullName,
          grade: row.grade,
          section: row.section,
          specialty: row.specialty,
          academicYearId: active.id,
        },
      });
      byName.set(nameKey(student.fullName), [student]);
    }
    let fee = feeByName.get(nameKey(row.concept));
    if (!fee) {
      fee = await prisma.feeCatalog.create({
        data: { name: row.concept, category: "SERVICES", sortOrder: 300 },
      });
      feeByName.set(nameKey(fee.name), fee);
    }
    const year = yearByName.get(schoolYearForDate(row.issueDate).name);
    if (!year) continue;
    const cashier = userByName.get(nameKey(row.cashierName));
    const duplicate = await prisma.receipt.findFirst({
      where: {
        studentId: student.id,
        receiptNumber: row.receiptNumber,
        issueDate: new Date(`${row.issueDate}T00:00:00.000Z`),
        feeCatalogId: fee.id,
        coveredMonth: row.month,
        amount: row.amount,
      },
      select: { id: true },
    });
    if (duplicate) continue;
    pending.push({
      receiptNumber: row.receiptNumber,
      issueDate: new Date(`${row.issueDate}T00:00:00.000Z`),
      studentId: student.id,
      academicYearId: year.id,
      feeCatalogId: fee.id,
      coveredMonth: row.month,
      coveredMonths: [row.month],
      amount: row.amount,
      paymentMethod: row.method,
      referenceNumber: row.reference,
      cashierId: cashier?.id ?? fallbackCashierId,
      cashierName: row.cashierName,
      cashierRole: row.cashierRole,
    });
  }

  for (let index = 0; index < pending.length; index += 100) {
    const chunk = pending.slice(index, index + 100);
    const result = await prisma.receipt.createMany({ data: chunk });
    inserted += result.count;
  }
  return { inserted, skipped: rows.length - inserted };
}
