const AUTO = /^REC-(\d{4})-(\d{6})$/;

export function formatReceiptNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Año de recibo inválido");
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999999) {
    throw new Error("Secuencia de recibo inválida");
  }
  return `REC-${year}-${String(sequence).padStart(6, "0")}`;
}

export function isAutoReceiptNumber(value: string): boolean {
  return AUTO.test(value.trim());
}

export function normalizeReceiptNumber(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 40);
}
