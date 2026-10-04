import type { CalendarMonthCode } from "./months";

export type SchoolYearSpan = {
  name: string;
  startYear: number;
  endYear: number;
  startsOn: string;
  endsOn: string;
};

/**
 * Régimen Costa: el lectivo abre en mayo y cierra en febrero.
 * Enero a abril pertenecen al lectivo que empezó el mayo anterior.
 */
export function schoolYearForDate(isoDate: string): SchoolYearSpan {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  if (!Number.isInteger(year) || month < 1 || month > 12) {
    throw new Error("Fecha inválida");
  }
  const startYear = month >= 5 ? year : year - 1;
  return span(startYear);
}

export function schoolYearForMonth(calendarYear: number, month: CalendarMonthCode): SchoolYearSpan {
  const monthNumber = [
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
  ].indexOf(month) + 1;
  const iso = `${calendarYear}-${String(monthNumber).padStart(2, "0")}-15`;
  return schoolYearForDate(iso);
}

export function span(startYear: number): SchoolYearSpan {
  const endYear = startYear + 1;
  return {
    name: `${startYear}-${endYear}`,
    startYear,
    endYear,
    startsOn: `${startYear}-05-01`,
    endsOn: `${endYear}-02-28`,
  };
}

export function isCostaMonth(month: CalendarMonthCode): boolean {
  return month !== "MAR" && month !== "APR";
}
