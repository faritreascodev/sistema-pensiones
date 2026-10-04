export const CALENDAR_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

export type CalendarMonthCode = (typeof CALENDAR_MONTHS)[number];

/** Orden del año lectivo Costa: mayo a febrero. */
export const COSTA_MONTHS = [
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
  "JAN",
  "FEB",
] as const satisfies readonly CalendarMonthCode[];

const LABELS: Record<CalendarMonthCode, string> = {
  JAN: "Enero",
  FEB: "Febrero",
  MAR: "Marzo",
  APR: "Abril",
  MAY: "Mayo",
  JUN: "Junio",
  JUL: "Julio",
  AUG: "Agosto",
  SEP: "Septiembre",
  OCT: "Octubre",
  NOV: "Noviembre",
  DEC: "Diciembre",
};

const FROM_SPANISH: Record<string, CalendarMonthCode> = {
  enero: "JAN",
  febrero: "FEB",
  marzo: "MAR",
  abril: "APR",
  mayo: "MAY",
  junio: "JUN",
  julio: "JUL",
  agosto: "AUG",
  septiembre: "SEP",
  setiembre: "SEP",
  octubre: "OCT",
  noviembre: "NOV",
  diciembre: "DEC",
};

export function monthLabel(month: CalendarMonthCode): string {
  return LABELS[month];
}

export function monthFromSpanish(value: string): CalendarMonthCode | null {
  const key = value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
  return FROM_SPANISH[key] ?? null;
}

export function monthFromDate(isoDate: string): CalendarMonthCode {
  const month = Number(isoDate.slice(5, 7));
  const code = CALENDAR_MONTHS[month - 1];
  if (!code) throw new Error("Fecha inválida");
  return code;
}
