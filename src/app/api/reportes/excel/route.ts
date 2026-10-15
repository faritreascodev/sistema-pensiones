import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { currentUser } from "@/server/current-user";
import { collectionReport } from "@/server/reports";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return new NextResponse("Rango inválido", { status: 400 });
  }
  const requestedCashier = url.searchParams.get("cashierId") || undefined;
  const report = await collectionReport({
    from,
    to,
    cashierId: user.role === "ADMIN" ? requestedCashier : user.id,
    includeVoided: url.searchParams.get("anulados") === "1",
    q: url.searchParams.get("q") || undefined,
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("BD Registros Recibo");
  sheet.addRow([
    "Apellido y Nombre",
    "Curso",
    "Paralelo",
    "Especialidad",
    "N. Recibo",
    "Fecha",
    "Concepto",
    "Mes abono",
    "Cantidad",
    "Forma de pago",
    "N. cheque",
    "Atencion",
    "Cargo",
    "Estado",
    "Nota",
  ]);
  for (const row of report.rows) {
    sheet.addRow([
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
  const bytes = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="recaudacion-${from}-${to}.xlsx"`,
    },
  });
}
