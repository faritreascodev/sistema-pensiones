/** Tope visible. Ninguna tabla muestra más de esto de un tirón. */
export const PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 50;

export function pageSize(requested?: number) {
  if (requested == null || !Number.isFinite(requested) || requested < 1) return PAGE_SIZE;
  return Math.min(Math.floor(requested), MAX_PAGE_SIZE);
}

export function pageBounds(page: number, total: number, size = PAGE_SIZE) {
  const take = pageSize(size);
  const safeTotal = Math.max(0, Math.floor(total) || 0);
  const pages = Math.max(1, Math.ceil(safeTotal / take));
  const current = Math.min(pages, Math.max(1, Math.floor(Number.isFinite(page) ? page : 1) || 1));
  const skip = (current - 1) * take;
  return {
    page: current,
    pages,
    skip,
    take,
    total: safeTotal,
    from: safeTotal === 0 ? 0 : skip + 1,
    to: Math.min(skip + take, safeTotal),
  };
}

export function paginate<T>(rows: readonly T[], page: number, size = PAGE_SIZE) {
  const bounds = pageBounds(page, rows.length, size);
  return { ...bounds, rows: rows.slice(bounds.skip, bounds.skip + bounds.take) };
}

export function pageWindow(page: number, pages: number): Array<number | "…"> {
  const last = Math.max(1, Math.floor(pages) || 1);
  const current = Math.min(last, Math.max(1, Math.floor(page) || 1));
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);
  const wanted = [1, last, current - 2, current - 1, current, current + 1, current + 2];
  const sorted = [...new Set(wanted.filter((item) => item >= 1 && item <= last))].sort((a, b) => a - b);
  const items: Array<number | "…"> = [];
  for (const item of sorted) {
    const previous = items[items.length - 1];
    if (typeof previous === "number" && item - previous > 1) items.push("…");
    items.push(item);
  }
  return items;
}

export function pageHref(path: string, params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || key === "page") continue;
    query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}
