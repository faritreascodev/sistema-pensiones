const MONEY_PATTERN = /^\d{1,6}(\.\d{1,2})?$/;

export function isMoneyString(value: string): boolean {
  return MONEY_PATTERN.test(value) && Number(value) > 0;
}

export function toCents(value: string): number {
  const normalized = value.trim();
  if (!MONEY_PATTERN.test(normalized)) {
    throw new Error("Monto inválido");
  }
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("Monto inválido");
  }
  return cents;
}

export function fromCents(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error("Centavos inválidos");
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function addMoney(left: string, right: string): string {
  return fromCents(toCents(left) + toCents(right));
}

export function compareMoney(left: string, right: string): number {
  return toCents(left) - toCents(right);
}

export function formatUsd(value: string): string {
  const cents = toCents(value);
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function sumMoney(values: string[]): string {
  const cents = values.reduce((total, value) => total + toCents(value), 0);
  return fromCents(cents);
}

export function normalizeMoney(value: string): string {
  return fromCents(toCents(value));
}

export function decimalToMoney(value: { toString(): string } | string | number): string {
  const raw = String(value);
  if (!/^\d{1,8}(\.\d+)?$/.test(raw)) throw new Error("Monto inválido");
  const [whole, fraction = ""] = raw.split(".");
  return `${whole}.${(fraction + "00").slice(0, 2)}`;
}
