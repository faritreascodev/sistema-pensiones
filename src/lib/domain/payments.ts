export const PAYMENT_METHODS = [
  { code: "CASH", label: "Efectivo" },
  { code: "TRANSFER", label: "Transferencia" },
  { code: "DEPOSIT", label: "Transferencia" },
  { code: "CHECK", label: "Cheque" },
] as const;

/** En caja solo se cobra efectivo o transferencia. El depósito se registra como transferencia. */
export const CASHIER_METHODS = [
  { code: "CASH" as const, label: "Efectivo" },
  { code: "TRANSFER" as const, label: "Transferencia" },
];

export const BANKS = [
  "Banco Pichincha",
  "Banco del Pacífico",
  "Banco de Guayaquil",
  "Produbanco",
  "Banco Bolivariano",
  "Banco Internacional",
  "BanEcuador",
  "Banco Solidario",
  "Banco del Austro",
  "Cooperativa JEP",
  "Cooperativa 29 de Octubre",
  "Mutualista Pichincha",
] as const;

export type PaymentMethodCode = (typeof PAYMENT_METHODS)[number]["code"];

export function paymentLabel(code: PaymentMethodCode): string {
  return PAYMENT_METHODS.find((item) => item.code === code)?.label ?? code;
}

export function paymentFromSpanish(value: string): PaymentMethodCode | null {
  const key = value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
  if (key.startsWith("efectivo")) return "CASH";
  if (key.startsWith("transfer")) return "TRANSFER";
  if (key.startsWith("deposit") || key.startsWith("depos")) return "DEPOSIT";
  if (key.startsWith("cheque")) return "CHECK";
  return null;
}

export function needsBankDetail(method: PaymentMethodCode): boolean {
  return method !== "CASH";
}
