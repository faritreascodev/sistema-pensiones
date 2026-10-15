import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { currentUser } from "@/server/current-user";
import { prisma } from "@/server/db";
import { addStudentSheet, workbookResponse } from "@/server/spreadsheet";
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
  const url = new URL(request.url);
  const yearId = url.searchParams.get("anio") ?? "";
  const year = yearId ? await prisma.academicYear.findUnique({ where: { id: yearId } }) : null;
  if (yearId && !year) return new NextResponse("Año lectivo inválido", { status: 400 });
  const list = await listStudents({
    academicYearId: year?.id,
    q: url.searchParams.get("q") || undefined,
    grade: url.searchParams.get("grade") || undefined,
    section: url.searchParams.get("section") || undefined,
    all: true,
  });
  const workbook = new ExcelJS.Workbook();
  addStudentSheet(
    workbook,
    list.rows.map((student) => ({ ...student, status: STATUS[student.status] ?? student.status, yearName: year?.name ?? "" })),
  );
  return workbookResponse(workbook, `estudiantes-${year?.name ?? "todos"}.xlsx`);
}
