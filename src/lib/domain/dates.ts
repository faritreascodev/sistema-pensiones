const GUAYAQUIL = "America/Guayaquil";

export function todayInGuayaquil(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GUAYAQUIL }).format(now);
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function asUtcDate(isoDate: string): Date {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isoFromDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
