import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { COSTA_MONTHS, monthLabel } from "../lib/domain/months";

export async function workbookResponse(workbook: ExcelJS.Workbook, filename: string) {
  const bytes = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function addStudentSheet(
  workbook: ExcelJS.Workbook,
  rows: { fullName: string; idCard: string | null; grade: string; section: string | null; specialty: string; status: string; yearName: string }[],
) {
  const sheet = workbook.addWorksheet("Estudiantes");
  sheet.addRow(["Año lectivo", "Apellido y nombre", "Cédula", "Curso", "Paralelo", "Especialidad", "Estado"]);
  for (const row of rows) {
    sheet.addRow([row.yearName, row.fullName, row.idCard ?? "", row.grade, row.section ?? "", row.specialty, row.status]);
  }
  sheet.getRow(1).font = { bold: true };
}

export function addDebtSheet(
  workbook: ExcelJS.Workbook,
  rows: { fullName: string; grade: string; section: string; specialty: string; months: string[]; pending: number; partial: number; paid: number }[],
) {
  const sheet = workbook.addWorksheet("Deudas");
  sheet.addRow(["Estudiante", "Curso", "Paralelo", "Especialidad", ...COSTA_MONTHS.map((month) => monthLabel(month)), "Pendientes", "Abonos", "Pagados"]);
  for (const row of rows) {
    sheet.addRow([
      row.fullName,
      row.grade,
      row.section,
      row.specialty,
      ...row.months.map((status) => (status === "PAGADO" ? "Pagado" : status === "ABONO" ? "Abono" : "Debe")),
      row.pending,
      row.partial,
      row.paid,
    ]);
  }
  sheet.getRow(1).font = { bold: true };
}

export function addReceiptSheet(
  workbook: ExcelJS.Workbook,
  rows: {
    fullName: string;
    grade: string;
    section: string;
    specialty: string;
    receiptNumber: string;
    issueDate: string;
    concept: string;
    month: string;
    amount: string;
    method: string;
    reference: string;
    cashierName: string;
    cashierRole: string;
    status: string;
    notes: string;
    yearName?: string;
  }[],
) {
  const sheet = workbook.addWorksheet("Recibos");
  sheet.addRow([
    "Año lectivo",
    "Apellido y nombre",
    "Curso",
    "Paralelo",
    "Especialidad",
    "N. recibo",
    "Fecha",
    "Concepto",
    "Mes",
    "Cantidad",
    "Forma de pago",
    "Referencia",
    "Atención",
    "Cargo",
    "Estado",
    "Nota",
  ]);
  for (const row of rows) {
    sheet.addRow([
      row.yearName ?? "",
      row.fullName,
      row.grade,
      row.section,
      row.specialty,
      row.receiptNumber,
      row.issueDate,
      row.concept,
      row.month,
      Number(row.amount),
      row.method,
      row.reference,
      row.cashierName,
      row.cashierRole,
      row.status === "VOIDED" ? "Anulado" : "Emitido",
      row.notes,
    ]);
  }
  sheet.getRow(1).font = { bold: true };
}
