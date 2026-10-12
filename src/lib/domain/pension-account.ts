import { COSTA_MONTHS } from "./months";

export type MonthStatus = "PAGADO" | "ABONO" | "PENDIENTE";

export type PensionPayment = {
  kind: "FULL" | "PARTIAL";
  months: readonly string[];
  cents: number;
};

export function foldPension(payments: readonly PensionPayment[]) {
  const marks = new Map<string, { status: "PAGADO" | "ABONO"; cents: number }>();
  for (const payment of payments) {
    const months = [...new Set(payment.months)];
    if (!months.length || payment.cents <= 0) continue;
    const share = Math.round(payment.cents / months.length);
    for (const month of months) {
      const current = marks.get(month) ?? { status: "ABONO" as const, cents: 0 };
      current.cents += share;
      if (payment.kind === "FULL") current.status = "PAGADO";
      marks.set(month, current);
    }
  }
  return marks;
}

export function costaRows(marks: ReadonlyMap<string, { status: "PAGADO" | "ABONO"; cents: number }>) {
  return COSTA_MONTHS.map((month) => {
    const row = marks.get(month);
    return {
      month,
      status: (row?.status ?? "PENDIENTE") as MonthStatus,
      cents: row?.cents ?? 0,
    };
  });
}

export function debtCounts(statuses: readonly MonthStatus[]) {
  return {
    pending: statuses.filter((status) => status === "PENDIENTE").length,
    partial: statuses.filter((status) => status === "ABONO").length,
    paid: statuses.filter((status) => status === "PAGADO").length,
  };
}

/** Debe algo: mes vacío o solo abonado. Al día es pensión completa en los diez meses. */
export function owesPension(statuses: readonly MonthStatus[]) {
  return statuses.some((status) => status !== "PAGADO");
}

export function fullMonths(payments: readonly { kind: "FULL" | "PARTIAL" | null; months: readonly string[] }[]) {
  const blocked = new Set<string>();
  for (const payment of payments) {
    if (payment.kind !== "FULL") continue;
    for (const month of payment.months) blocked.add(month);
  }
  return blocked;
}

export function collidingMonths(requested: readonly string[], blocked: ReadonlySet<string>) {
  return [...new Set(requested)].filter((month) => blocked.has(month));
}
