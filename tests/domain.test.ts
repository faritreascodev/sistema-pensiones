import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidEcuadorianCedula } from "../src/lib/domain/cedula.ts";
import { canonicalGrade } from "../src/lib/domain/grades.ts";
import { FEE_CATALOG, pensionKind } from "../src/lib/domain/fees.ts";
import { decimalToMoney, formatUsd, sumMoney, toCents } from "../src/lib/domain/money.ts";
import { monthFromSpanish } from "../src/lib/domain/months.ts";
import { formatReceiptNumber } from "../src/lib/domain/receipt-number.ts";
import { schoolYearForDate } from "../src/lib/domain/school-year.ts";
import { canonicalSpecialty } from "../src/lib/domain/specialty.ts";

describe("cédula ecuatoriana", () => {
  it("acepta el dígito verificador", () => {
    assert.equal(isValidEcuadorianCedula("1710034065"), true);
    assert.equal(isValidEcuadorianCedula("1710034066"), false);
  });
});

describe("régimen Costa", () => {
  it("abre el lectivo en mayo y cierra el anterior en febrero", () => {
    assert.equal(schoolYearForDate("2026-10-17").name, "2026-2027");
    assert.equal(schoolYearForDate("2025-02-04").name, "2024-2025");
    assert.equal(schoolYearForDate("2025-07-28").name, "2025-2026");
  });
});

describe("catálogos del Excel", () => {
  it("normaliza el curso con la falta de ortografía del libro", () => {
    assert.equal(canonicalGrade("Pimero Bachillerato"), "Primero de Bachillerato");
    assert.equal(canonicalGrade("Septimo"), "Séptimo de Básica");
    assert.equal(canonicalSpecialty("Mecánica"), "MECANICA");
    assert.equal(monthFromSpanish("Diciembre"), "DEC");
  });

  it("trae los rubros que de verdad se cobran", () => {
    const names = FEE_CATALOG.map((fee) => fee.name);
    assert.ok(names.includes("Pension"));
    assert.ok(names.includes("Abono de pensiones"));
    assert.ok(names.includes("CARTERA VENCIDA2025"));
    assert.equal(new Set(names).size, names.length);
    assert.equal(pensionKind("PENSION", "Pension"), "FULL");
    assert.equal(pensionKind("PENSION", "Abono de pensiones"), "PARTIAL");
    assert.equal(pensionKind("PENSION", "Saldo de pensiones"), "PARTIAL");
    assert.equal(pensionKind("BOOKS", "Libros"), null);
  });
});

describe("dinero y recibo", () => {
  it("suma en centavos y arma el correlativo", () => {
    assert.equal(toCents("12.50"), 1250);
    assert.equal(sumMoney(["12.50", "0.50"]), "13.00");
    assert.equal(decimalToMoney("35"), "35.00");
    assert.match(formatUsd("25.00"), /25/);
    assert.equal(formatReceiptNumber(2026, 526), "REC-2026-000526");
  });
});
