"use server";

import { revalidatePath } from "next/cache";
import { issueReceiptSchema, voidSchema } from "../../lib/validations/forms";
import { requireUser } from "../current-user";
import { errorMessage } from "../errors";
import { getStudentAccount, issueReceipt, searchStudents, studentsByCourse, voidReceipt } from "../receipts";

export async function searchStudentsAction(query: string, academicYearId?: string) {
  await requireUser();
  return searchStudents(query, academicYearId);
}

export async function accountAction(studentId: string, academicYearId?: string) {
  await requireUser();
  return getStudentAccount(studentId, academicYearId);
}

export async function studentsByCourseAction(academicYearId: string, grade: string, section?: string) {
  await requireUser();
  return studentsByCourse(academicYearId, grade, section);
}

export async function issueReceiptAction(formData: FormData) {
  const actor = await requireUser();
  const parsed = issueReceiptSchema.safeParse({
    studentId: formData.get("studentId"),
    academicYearId: formData.get("academicYearId"),
    feeCatalogId: formData.get("feeCatalogId"),
    coveredMonths: formData.getAll("coveredMonths"),
    amount: formData.get("amount"),
    issueDate: formData.get("issueDate"),
    receiptNumber: formData.get("receiptNumber") || "",
    paymentMethod: formData.get("paymentMethod"),
    referenceNumber: formData.get("referenceNumber") || "",
    bankName: formData.get("bankName") || "",
    bankDate: formData.get("bankDate") || "",
    cashierId: formData.get("cashierId"),
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Revisa el formulario" };
  }

  const file = formData.get("voucher");
  let voucher: { buffer: Buffer; originalName: string } | undefined;
  if (file instanceof File && file.size > 0) {
    voucher = { buffer: Buffer.from(await file.arrayBuffer()), originalName: file.name };
  }

  try {
    const receipt = await issueReceipt(
      {
        ...parsed.data,
        receiptNumber: parsed.data.receiptNumber || undefined,
        referenceNumber: parsed.data.referenceNumber || undefined,
        bankName: parsed.data.bankName || undefined,
        bankDate: parsed.data.bankDate || undefined,
        notes: parsed.data.notes || undefined,
      },
      actor,
      voucher,
    );
    revalidatePath("/caja");
    revalidatePath("/reportes");
    revalidatePath("/vouchers");
    return { ok: true as const, receipt };
  } catch (error) {
    return { ok: false as const, error: errorMessage(error, "No se pudo emitir el recibo.") };
  }
}

export async function voidLastReceiptAction(formData: FormData) {
  const actor = await requireUser();
  const parsed = voidSchema.safeParse({
    reason: formData.get("reason"),
    receiptId: formData.get("receiptId") || undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Motivo inválido" };
  }
  try {
    const result = await voidReceipt(actor, parsed.data.reason, parsed.data.receiptId);
    revalidatePath("/caja");
    revalidatePath("/reportes");
    revalidatePath("/estudiantes");
    return { ok: true as const, receiptNumber: result.receiptNumber };
  } catch (error) {
    return { ok: false as const, error: errorMessage(error, "No se pudo anular el recibo.") };
  }
}
