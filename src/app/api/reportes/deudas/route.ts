import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { currentUser } from "@/server/current-user";
import { prisma } from "@/server/db";
import { debtReport } from "@/server/reports";
import { addDebtSheet, workbookResponse } from "@/server/spreadsheet";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });
  const url = new URL(request.url);
  const yearId = url.searchParams.get("anio") ?? "";
  const grade = url.searchParams.get("grade") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const onlyDebtors = url.searchParams.get("solo") === "1";
  const year = await prisma.academicYear.findUnique({ where: { id: yearId } });
  if (!year) return new NextResponse("Año lectivo inválido", { status: 400 });
  const report = await debtReport(year.id, grade, q);
  const workbook = new ExcelJS.Workbook();
  addDebtSheet(workbook, onlyDebtors ? report.debtors : report.rows);
  return workbookResponse(workbook, `${onlyDebtors ? "deudores" : "deudas"}-${year.name}.xlsx`);
}
