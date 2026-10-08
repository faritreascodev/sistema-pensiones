import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_PAGE_SIZE, PAGE_SIZE, pageBounds, pageHref, pageSize, pageWindow, paginate } from "../src/lib/domain/pagination.ts";

describe("paginación", () => {
  it("no pasa de 50 y usa 25 cuando no se pide tamaño", () => {
    assert.equal(PAGE_SIZE, 25);
    assert.equal(pageSize(undefined), 25);
    assert.equal(pageSize(0), 25);
    assert.equal(pageSize(Number.NaN), 25);
    assert.equal(pageSize(80), MAX_PAGE_SIZE);
    assert.equal(pageSize(25.9), 25);
  });

  it("parte 1000 filas sin salirse ni devolver de más", () => {
    const rows = Array.from({ length: 1000 }, (_, index) => index);
    const first = paginate(rows, 1);
    assert.equal(first.rows.length, 25);
    assert.equal(first.from, 1);
    assert.equal(first.to, 25);
    assert.equal(first.pages, 40);
    assert.deepEqual(first.rows, rows.slice(0, 25));

    const last = paginate(rows, 999);
    assert.equal(last.page, 40);
    assert.equal(last.rows.length, 25);
    assert.equal(last.from, 976);
    assert.equal(last.to, 1000);
    assert.equal(last.rows[0], 975);

    const middle = paginate(rows, 2.8);
    assert.equal(middle.page, 2);
    assert.equal(middle.rows[0], 25);
  });

  it("una lista vacía o exacta no inventa páginas", () => {
    const empty = paginate([], -3);
    assert.equal(empty.total, 0);
    assert.equal(empty.pages, 1);
    assert.equal(empty.from, 0);
    assert.equal(empty.rows.length, 0);

    const exact = paginate(Array.from({ length: 50 }, (_, index) => index), 2, 50);
    assert.equal(exact.pages, 1);
    assert.equal(exact.page, 1);
    assert.equal(exact.rows.length, 50);
  });

  it("26 registros ocupan dos páginas y la segunda trae uno", () => {
    const view = paginate(Array.from({ length: 26 }, (_, index) => index), 2);
    assert.equal(view.pages, 2);
    assert.deepEqual(view.rows, [25]);
    assert.equal(view.from, 26);
    assert.equal(view.to, 26);
  });

  it("arma la ventana de páginas y conserva el filtro al cambiar de hoja", () => {
    assert.deepEqual(pageWindow(1, 1), [1]);
    assert.deepEqual(pageWindow(1, 10), [1, 2, 3, "…", 10]);
    assert.deepEqual(pageWindow(10, 20), [1, "…", 8, 9, 10, 11, 12, "…", 20]);
    assert.deepEqual(pageWindow(20, 20), [1, "…", 18, 19, 20]);
    assert.equal(pageHref("/estudiantes", { anio: "2026", q: "ana", page: "4" }, 1), "/estudiantes?anio=2026&q=ana");
    assert.equal(pageHref("/estudiantes", { anio: "2026", q: "", grade: undefined }, 3), "/estudiantes?anio=2026&page=3");
  });

  it("el salto de base de datos coincide con el corte en memoria", () => {
    const bounds = pageBounds(3, 70);
    assert.deepEqual(
      { skip: bounds.skip, take: bounds.take, from: bounds.from, to: bounds.to },
      { skip: 50, take: 25, from: 51, to: 70 },
    );
  });
});
