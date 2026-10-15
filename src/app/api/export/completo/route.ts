import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { isoFromDate } from "@/lib/domain/dates";
import { currentUser } from "@/server/current-user";
import { prisma } from "@/server/db";
import { collectionReport, debtReport } from "@/server/reports";
import { addDebtSheet, addReceiptSheet, addStudentSheet, workbookResponse } from "@/server/spreadsheet";
import { listStudents } from "@/server/students";

const STATUS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  GRADUATED: "Graduado",
  WITHDRAWN: "Retirado",
};

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });
  const yearId = new URL(request.url).searchParams.get("anio") ?? "";
  const years = yearId
    ? await prisma.academicYear.findMany({ where: { id: yearId } })
    : await prisma.academicYear.findMany({ orderBy: { startYear: "asc" } });
  if (yearId && years.length === 0) return new NextResponse("Año lectivo inválido", { status: 400 });

  const workbook = new ExcelJS.Workbook();
  const students = [];
  const debts = [];
  const receipts = [];
  for (const year of years) {
    const list = await listStudents({ academicYearId: year.id, all: true });
    students.push(...list.rows.map((student) => ({ ...student, status: STATUS[student.status] ?? student.status, yearName: year.name })));
    const debt = await debtReport(year.id);
    debts.push(...debt.rows);
    const from = isoFromDate(year.startsOn);
    const to = isoFromDate(year.endsOn);
    const payments = await collectionReport({ from, to, includeVoided: true });
    receipts.push(...payments.rows.map((row) => ({ ...row, yearName: year.name })));
  }
  addStudentSheet(workbook, students);
  addReceiptSheet(workbook, receipts);
  addDebtSheet(workbook, debts);
  const label = years.length === 1 ? years[0].name : "completo";
  return workbookResponse(workbook, `pensiones-${label}.xlsx`);
}
