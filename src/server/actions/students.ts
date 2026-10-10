"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { studentSchema } from "../../lib/validations/forms";
import { requireAdmin, requireUser } from "../current-user";
import { errorMessage } from "../errors";
import { deleteStudent, saveStudent } from "../students";

export async function deleteStudentAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try {
    await deleteStudent(id, actor);
  } catch (error) {
    redirect(`/estudiantes/${id}?error=${encodeURIComponent(errorMessage(error, "No se pudo eliminar."))}`);
  }
  revalidatePath("/estudiantes");
  redirect("/estudiantes");
}

export async function saveStudentAction(_state: { error?: string } | null, formData: FormData) {
  const actor = await requireUser();
  const parsed = studentSchema.safeParse({
    id: formData.get("id") || undefined,
    fullName: formData.get("fullName"),
    idCard: String(formData.get("idCard") ?? "").replace(/\D/g, ""),
    grade: formData.get("grade"),
    section: formData.get("section") || "",
    specialty: formData.get("specialty") || "",
    status: formData.get("status"),
    academicYearId: formData.get("academicYearId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario" };
  try {
    const id = await saveStudent(parsed.data, actor);
    revalidatePath("/estudiantes");
    revalidatePath(`/estudiantes/${id}`);
    redirect(`/estudiantes/${id}`);
  } catch (error) {
    unstable_rethrow(error);
    return { error: errorMessage(error, "No se pudo guardar el estudiante.") };
  }
}

