export const SPECIALTIES = [
  { code: "EGB", label: "EGB" },
  { code: "MECANICA", label: "Mecánica" },
  { code: "INFORMATICA", label: "Informática" },
  { code: "ELECTRICIDAD", label: "Electricidad" },
  { code: "EBANISTERIA", label: "Ebanistería" },
] as const;

export type SpecialtyCode = (typeof SPECIALTIES)[number]["code"];

const ALIASES: Record<string, SpecialtyCode> = {
  egb: "EGB",
  mecanica: "MECANICA",
  informatica: "INFORMATICA",
  electricidad: "ELECTRICIDAD",
  ebanisteria: "EBANISTERIA",
};

export function specialtyLabel(code: SpecialtyCode | null | undefined): string {
  if (!code) return "—";
  return SPECIALTIES.find((item) => item.code === code)?.label ?? code;
}

export function canonicalSpecialty(value: string | null | undefined): SpecialtyCode | null {
  if (!value) return null;
  const key = value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/#N\/A/gi, "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  return ALIASES[key] ?? null;
}
