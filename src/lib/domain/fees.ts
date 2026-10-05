export const FEE_CATEGORIES = [
  { code: "PENSION", label: "Pensiones" },
  { code: "BOOKS", label: "Libros y módulos" },
  { code: "UNIFORM", label: "Uniformes" },
  { code: "SERVICES", label: "Servicios y aranceles" },
  { code: "ARREARS", label: "Cartera vencida" },
] as const;

export type FeeCategoryCode = (typeof FEE_CATEGORIES)[number]["code"];

type FeeSeed = { name: string; category: FeeCategoryCode; sortOrder: number };

/** Nombres tal como están en la hoja Lista, sin el duplicado de saldo de matrícula. */
export const FEE_CATALOG: FeeSeed[] = [
  { name: "Pension", category: "PENSION", sortOrder: 1 },
  { name: "Abono de pensiones", category: "PENSION", sortOrder: 2 },
  { name: "Saldo de pensiones", category: "PENSION", sortOrder: 3 },
  { name: "MATRICULA", category: "SERVICES", sortOrder: 10 },
  { name: "ABONO DE MATRICULA", category: "SERVICES", sortOrder: 11 },
  { name: "SALDO DE MATRICULA", category: "SERVICES", sortOrder: 12 },
  { name: "Libros", category: "BOOKS", sortOrder: 20 },
  { name: "Abono de libros", category: "BOOKS", sortOrder: 21 },
  { name: "Saldo de libros", category: "BOOKS", sortOrder: 22 },
  { name: "MODULOS", category: "BOOKS", sortOrder: 23 },
  { name: "ABONO DE MODULOS", category: "BOOKS", sortOrder: 24 },
  { name: "CARPETA", category: "BOOKS", sortOrder: 25 },
  { name: "Uniformes", category: "UNIFORM", sortOrder: 30 },
  { name: "ABONO DE UNIFORME", category: "UNIFORM", sortOrder: 31 },
  { name: "SALDO DE UNIFORME DEPORTIVO", category: "UNIFORM", sortOrder: 32 },
  { name: "Uniforme Ed. Fisica completo", category: "UNIFORM", sortOrder: 33 },
  { name: "Camiseta Ed. Fisica", category: "UNIFORM", sortOrder: 34 },
  { name: "Camiseta polo", category: "UNIFORM", sortOrder: 35 },
  { name: "CAMISA BRIGADA", category: "UNIFORM", sortOrder: 36 },
  { name: "Corbata", category: "UNIFORM", sortOrder: 37 },
  { name: "Medias", category: "UNIFORM", sortOrder: 38 },
  { name: "Bolsillos", category: "UNIFORM", sortOrder: 39 },
  { name: "Calentador", category: "UNIFORM", sortOrder: 40 },
  { name: "MANDIL", category: "UNIFORM", sortOrder: 41 },
  { name: "Practicas regulares", category: "SERVICES", sortOrder: 50 },
  { name: "Abono de practicas", category: "SERVICES", sortOrder: 51 },
  { name: "Saldo Practicas Regulares", category: "SERVICES", sortOrder: 52 },
  { name: "Opciones practicas", category: "SERVICES", sortOrder: 53 },
  { name: "Abono de educacion fisica", category: "SERVICES", sortOrder: 54 },
  { name: "CURSILLO", category: "SERVICES", sortOrder: 55 },
  { name: "ABONO DE CURSILLO", category: "SERVICES", sortOrder: 56 },
  { name: "SALDO CURSILLO", category: "SERVICES", sortOrder: 57 },
  { name: "CUPO", category: "SERVICES", sortOrder: 58 },
  { name: "SEGURO", category: "SERVICES", sortOrder: 59 },
  { name: "CARNET", category: "SERVICES", sortOrder: 60 },
  { name: "PARTICIPACION ESTUDIANTIL", category: "SERVICES", sortOrder: 61 },
  { name: "BINGO", category: "SERVICES", sortOrder: 62 },
  { name: "DONACIONES BECADOS OBISPO", category: "SERVICES", sortOrder: 63 },
  { name: "ARRENDAMIENTO DEL BAR", category: "SERVICES", sortOrder: 64 },
  { name: "PURIFICADOR AGUA", category: "SERVICES", sortOrder: 65 },
  { name: "Abono de regalo 3ero bachillerato", category: "SERVICES", sortOrder: 66 },
  { name: "REGALO DE GRADUCACION", category: "SERVICES", sortOrder: 67 },
  { name: "CONDONACION", category: "SERVICES", sortOrder: 68 },
  { name: "CARTERA VENCIDA 2020", category: "ARREARS", sortOrder: 80 },
  { name: "CARTERA VENCIDAD 2021", category: "ARREARS", sortOrder: 81 },
  { name: "CARTERA VENCIDA 2023", category: "ARREARS", sortOrder: 82 },
  { name: "SALDO CARTERA VENCIDA 2024", category: "ARREARS", sortOrder: 83 },
  { name: "ABONO DE CARTERA 2024", category: "ARREARS", sortOrder: 84 },
  { name: "CARTERA VENCIDA2025", category: "ARREARS", sortOrder: 85 },
];

export function categoryLabel(code: FeeCategoryCode): string {
  return FEE_CATEGORIES.find((item) => item.code === code)?.label ?? code;
}

export function normalizeFeeName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Pago completo de la pensión, o abono/saldo parcial. Null si el rubro no es pensión. */
export function pensionKind(category: string, name: string): "FULL" | "PARTIAL" | null {
  if (category !== "PENSION") return null;
  const key = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (key.includes("abono") || key.includes("saldo")) return "PARTIAL";
  return "FULL";
}
