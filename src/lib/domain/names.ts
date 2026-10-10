export function nameKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function displayName(value: string): string {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}
