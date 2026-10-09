"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { feeSchema, reviewSchema, userSchema } from "../../lib/validations/forms";
import { activateSchoolYear, deleteFee, deleteSchoolYear, deleteUser, openSchoolYear, reviewVoucher, saveFee, saveUser } from "../admin";
import { requireAdmin } from "../current-user";
import { errorMessage } from "../errors";

export async function saveUserAction(_state: { error?: string; ok?: boolean } | null, formData: FormData) {
  const actor = await requireAdmin();
  const parsed = userSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") || "",
    role: formData.get("role"),
    jobTitle: formData.get("jobTitle"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario" };
  try {
    await saveUser(parsed.data, actor);
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (error) {
    return { error: errorMessage(error, "No se pudo guardar el usuario.") };
  }
}

export async function deleteUserAction(formData: FormData) {
  const actor = await requireAdmin();
  try {
    await deleteUser(String(formData.get("id") ?? ""), actor);
  } catch (error) {
    redirect(`/admin/usuarios?error=${encodeURIComponent(errorMessage(error, "No se pudo eliminar el usuario."))}`);
  }
  revalidatePath("/admin/usuarios");
}

export async function deleteFeeAction(formData: FormData) {
  const actor = await requireAdmin();
  try {
    await deleteFee(String(formData.get("id") ?? ""), actor);
  } catch (error) {
    redirect(`/admin/catalogo?error=${encodeURIComponent(errorMessage(error, "No se pudo eliminar el concepto."))}`);
  }
  revalidatePath("/admin/catalogo");
  revalidatePath("/caja");
}

export async function deleteYearAction(formData: FormData) {
  const actor = await requireAdmin();
  try {
    await deleteSchoolYear(String(formData.get("id") ?? ""), actor);
  } catch (error) {
    redirect(`/admin/anios?error=${encodeURIComponent(errorMessage(error, "No se pudo eliminar el lectivo."))}`);
  }
  revalidatePath("/admin/anios");
}

export async function saveFeeAction(_state: { error?: string; ok?: boolean } | null, formData: FormData) {
  const actor = await requireAdmin();
  const parsed = feeSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    category: formData.get("category"),
    baseAmount: formData.get("baseAmount") || "",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario" };
  try {
    await saveFee(parsed.data, actor);
    revalidatePath("/admin/catalogo");
    revalidatePath("/caja");
    return { ok: true };
  } catch (error) {
    return { error: errorMessage(error, "No se pudo guardar el concepto.") };
  }
}

export async function openYearAction(formData: FormData) {
  const actor = await requireAdmin();
  const startYear = Number(formData.get("startYear"));
  if (!Number.isInteger(startYear) || startYear < 2020 || startYear > 2040) {
    redirect("/admin/anios?error=anio");
  }
  try {
    await openSchoolYear(startYear, actor);
  } catch (error) {
    redirect(`/admin/anios?error=${encodeURIComponent(errorMessage(error, "No se pudo abrir el lectivo."))}`);
  }
  revalidatePath("/admin/anios");
}

export async function activateYearAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try {
    await activateSchoolYear(id, actor);
  } catch (error) {
    redirect(`/admin/anios?error=${encodeURIComponent(errorMessage(error, "No se pudo activar el lectivo."))}`);
  }
  revalidatePath("/admin/anios");
  revalidatePath("/caja");
}

export async function reviewVoucherAction(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = reviewSchema.safeParse({
    voucherId: formData.get("voucherId"),
    status: formData.get("status"),
    note: formData.get("note") || "",
  });
  if (!parsed.success) redirect("/vouchers?error=revision");
  try {
    await reviewVoucher(parsed.data, actor);
  } catch (error) {
    redirect(`/vouchers?error=${encodeURIComponent(errorMessage(error, "No se pudo revisar el comprobante."))}`);
  }
  revalidatePath("/vouchers");
}
