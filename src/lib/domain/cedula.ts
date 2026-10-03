const COEFFICIENTS = [2, 1, 2, 1, 2, 1, 2, 1, 2];

/**
 * Cédula de persona natural ecuatoriana.
 * Acepta provincias 01–24 y 30 (exterior). El tercer dígito debe ser 0–5.
 */
export function isValidEcuadorianCedula(input: string): boolean {
  const value = input.trim();
  if (!/^\d{10}$/.test(value) || value === "0000000000") return false;

  const province = Number(value.slice(0, 2));
  const provinceIsValid = (province >= 1 && province <= 24) || province === 30;
  if (!provinceIsValid) return false;
  if (Number(value[2]) > 5) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    let product = Number(value[index]) * COEFFICIENTS[index];
    if (product > 9) product -= 9;
    sum += product;
  }

  const expected = (10 - (sum % 10)) % 10;
  return expected === Number(value[9]);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}
