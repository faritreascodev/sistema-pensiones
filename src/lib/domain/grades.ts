export const GRADES = [
  "Inicial",
  "Primero de Básica",
  "Segundo de Básica",
  "Tercero de Básica",
  "Cuarto de Básica",
  "Quinto de Básica",
  "Sexto de Básica",
  "Séptimo de Básica",
  "Octavo de Básica",
  "Noveno de Básica",
  "Décimo de Básica",
  "Primero de Bachillerato",
  "Segundo de Bachillerato",
  "Tercero de Bachillerato",
] as const;

export type GradeName = (typeof GRADES)[number];

const ALIASES: Record<string, GradeName> = {
  inicial: "Inicial",
  primero: "Primero de Básica",
  "primero de basica": "Primero de Básica",
  segundo: "Segundo de Básica",
  "segundo de basica": "Segundo de Básica",
  tercero: "Tercero de Básica",
  "tercero de basica": "Tercero de Básica",
  cuarto: "Cuarto de Básica",
  "cuarto de basica": "Cuarto de Básica",
  quinto: "Quinto de Básica",
  "quinto de basica": "Quinto de Básica",
  sexto: "Sexto de Básica",
  "sexto de basica": "Sexto de Básica",
  septimo: "Séptimo de Básica",
  "septimo de basica": "Séptimo de Básica",
  octavo: "Octavo de Básica",
  "octavo de basica": "Octavo de Básica",
  noveno: "Noveno de Básica",
  "noveno de basica": "Noveno de Básica",
  decimo: "Décimo de Básica",
  "decimo de basica": "Décimo de Básica",
  "pimero bachillerato": "Primero de Bachillerato",
  "primero bachillerato": "Primero de Bachillerato",
  "primero de bachillerato": "Primero de Bachillerato",
  "segundo bachillerato": "Segundo de Bachillerato",
  "segundo de bachillerato": "Segundo de Bachillerato",
  "tercero bachillerato": "Tercero de Bachillerato",
  "tercero de bachillerato": "Tercero de Bachillerato",
};

export function canonicalGrade(value: string): GradeName | null {
  const key = value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return ALIASES[key] ?? null;
}

export const SECTIONS = ["A", "B", "C", "D"] as const;

export function canonicalSection(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/["']/g, "").replace(/#N\/A/gi, "").trim().toUpperCase();
  if (!cleaned || cleaned === "NULL") return null;
  return cleaned.slice(0, 8);
}
