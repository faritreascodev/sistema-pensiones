import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nameKey } from "../src/lib/domain/names.ts";
import {
  collidingMonths,
  costaRows,
  debtCounts,
  foldPension,
  fullMonths,
  owesPension,
} from "../src/lib/domain/pension-account.ts";
import { pensionKind } from "../src/lib/domain/fees.ts";

describe("estado de pensión", () => {
  it("un pago completo cierra el mes y un abono posterior no lo reabre", () => {
    const marks = foldPension([
      { kind: "FULL", months: ["MAY"], cents: 2500 },
      { kind: "PARTIAL", months: ["MAY"], cents: 500 },
    ]);
    assert.equal(marks.get("MAY")?.status, "PAGADO");
    assert.equal(marks.get("MAY")?.cents, 3000);
  });

  it("el abono deja el mes abierto y el pago completo lo cierra", () => {
    const marks = foldPension([
      { kind: "PARTIAL", months: ["JUN"], cents: 1000 },
      { kind: "FULL", months: ["JUN"], cents: 1500 },
    ]);
    assert.equal(marks.get("JUN")?.status, "PAGADO");
    assert.equal(marks.get("JUN")?.cents, 2500);
  });

  it("reparte el monto entre los meses y no duplica un mes repetido", () => {
    const marks = foldPension([{ kind: "FULL", months: ["MAY", "JUN", "MAY"], cents: 1000 }]);
    assert.equal(marks.get("MAY")?.cents, 500);
    assert.equal(marks.get("JUN")?.cents, 500);
    assert.equal(marks.size, 2);
  });

  it("ignora un pago en cero y arma los diez meses de la Costa", () => {
    const rows = costaRows(foldPension([{ kind: "PARTIAL", months: ["OCT"], cents: 0 }]));
    assert.equal(rows.length, 10);
    assert.deepEqual(
      rows.map((row) => row.month),
      ["MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB"],
    );
    assert.equal(rows.every((row) => row.status === "PENDIENTE"), true);
  });

  it("separa al día, con abono y con meses vacíos", () => {
    const open = costaRows(foldPension([{ kind: "PARTIAL", months: ["MAY"], cents: 100 }]));
    const counts = debtCounts(open.map((row) => row.status));
    assert.equal(counts.partial, 1);
    assert.equal(counts.pending, 9);
    assert.equal(counts.paid, 0);
    assert.equal(owesPension(open.map((row) => row.status)), true);

    const clear = costaRows(
      foldPension([{ kind: "FULL", months: ["MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB"], cents: 1000 }]),
    );
    assert.equal(owesPension(clear.map((row) => row.status)), false);
  });

  it("bloquea solo la pensión completa y deja cobrar el saldo de un abono", () => {
    const blocked = fullMonths([
      { kind: "PARTIAL", months: ["MAY"] },
      { kind: "FULL", months: ["JUN", "JUL"] },
      { kind: null, months: ["AUG"] },
    ]);
    assert.deepEqual(collidingMonths(["MAY", "JUN", "JUN"], blocked), ["JUN"]);
    assert.deepEqual([...blocked], ["JUN", "JUL"]);
  });

  it("reconoce abono y saldo aunque el nombre venga del Excel", () => {
    assert.equal(pensionKind("PENSION", "Pension"), "FULL");
    assert.equal(pensionKind("PENSION", "Abono de pensiones"), "PARTIAL");
    assert.equal(pensionKind("PENSION", "SALDO DE PENSIONES"), "PARTIAL");
    assert.equal(pensionKind("BOOKS", "Abono de libros"), null);
    assert.equal(nameKey("Quiñónez"), nameKey("quinonez"));
  });
});
