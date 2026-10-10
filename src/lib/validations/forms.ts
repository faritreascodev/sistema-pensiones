import { z } from "zod";
import { isValidEcuadorianCedula } from "../domain/cedula";
import { CALENDAR_MONTHS } from "../domain/months";
import { isMoneyString } from "../domain/money";
import { SPECIALTIES } from "../domain/specialty";

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(120),
  password: z.string().min(8, "La clave tiene al menos 8 caracteres").max(80),
});

export const issueReceiptSchema = z
  .object({
    studentId: uuid,
    academicYearId: uuid,
    feeCatalogId: uuid,
    coveredMonths: z.array(z.enum(CALENDAR_MONTHS)).min(1, "Elige al menos un mes").max(12),
    amount: z.string().refine(isMoneyString, "La cantidad debe ser mayor que cero"),
    issueDate: isoDate,
    receiptNumber: z.string().trim().max(40).optional().or(z.literal("")),
    paymentMethod: z.enum(["CASH", "TRANSFER"]),
    referenceNumber: z.string().trim().max(40).optional().or(z.literal("")),
    bankName: z.string().trim().max(80).optional().or(z.literal("")),
    bankDate: z.string().optional().or(z.literal("")),
    cashierId: uuid,
    notes: z.string().trim().max(240).optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (value.paymentMethod === "CASH") return;
    if (!value.referenceNumber || value.referenceNumber.trim().length < 4) {
      context.addIssue({
        code: "custom",
        path: ["referenceNumber"],
        message: "El número de comprobante es obligatorio",
      });
    }
    if (!value.bankName || value.bankName.trim().length < 3) {
      context.addIssue({
        code: "custom",
        path: ["bankName"],
        message: "Indica el banco",
      });
    }
    if (!value.bankDate || !/^\d{4}-\d{2}-\d{2}$/.test(value.bankDate)) {
      context.addIssue({
        code: "custom",
        path: ["bankDate"],
        message: "Indica la fecha bancaria",
      });
    }
  });

export const voidSchema = z.object({
  reason: z.string().trim().min(10, "El motivo necesita al menos 10 caracteres").max(240),
  receiptId: uuid.optional(),
});

export const studentSchema = z.object({
  id: uuid.optional(),
  fullName: z.string().trim().min(5, "Escribe apellidos y nombres").max(120),
  idCard: z
    .string()
    .trim()
    .refine((value) => value === "" || isValidEcuadorianCedula(value), "Cédula ecuatoriana inválida"),
  grade: z.string().trim().min(2, "Elige un curso").max(60),
  section: z.string().trim().max(8).optional().or(z.literal("")),
  specialty: z.enum(["", ...SPECIALTIES.map((item) => item.code)] as [string, ...string[]]),
  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "WITHDRAWN"]),
  academicYearId: uuid,
});

export const userSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(5).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(80).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "COLLECTOR"]),
  jobTitle: z.string().trim().min(3).max(40),
  active: z.boolean(),
});

export const feeSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(2).max(80),
  category: z.enum(["PENSION", "UNIFORM", "BOOKS", "SERVICES", "ARREARS"]),
  baseAmount: z.string().refine((value) => value === "" || isMoneyString(value), "Monto inválido"),
  active: z.boolean(),
});

export const reviewSchema = z.object({
  voucherId: uuid,
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(240).optional().or(z.literal("")),
});
