"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CALENDAR_MONTHS, monthLabel, type CalendarMonthCode } from "@/lib/domain/months";
import { paginate } from "@/lib/domain/pagination";
import { formatUsd } from "@/lib/domain/money";
import { BANKS, CASHIER_METHODS, needsBankDetail, type PaymentMethodCode } from "@/lib/domain/payments";
import { categoryLabel, pensionKind, type FeeCategoryCode } from "@/lib/domain/fees";
import { SECTIONS } from "@/lib/domain/grades";
import {
  accountAction,
  issueReceiptAction,
  searchStudentsAction,
  studentsByCourseAction,
  voidLastReceiptAction,
} from "@/server/actions/caja";
import { downloadReceiptPdf } from "./receipt-pdf";
import { ReceiptPaper, type PaperReceipt } from "./receipt-paper";

type Fee = { id: string; name: string; category: FeeCategoryCode; baseAmount: string | null };
type Cashier = { id: string; name: string; jobTitle: string };
type Year = { id: string; name: string };
type StudentOption = {
  id: string;
  fullName: string;
  grade: string;
  section: string | null;
  specialtyLabel: string;
};
type MonthState = { month: string; label: string; status: "PAGADO" | "ABONO" | "PENDIENTE"; total: string };
type TodayRow = { id: string; receiptNumber: string; fullName: string; concept: string; amount: string; method: string; status: string };

const selectClass = "mt-1.5 h-11 w-full rounded border border-line bg-white px-3 text-sm";

export function CashierDesk({
  fees,
  cashiers,
  years,
  grades,
  activeYearId,
  actorId,
  actorIsAdmin,
  nextNumber,
  today,
  todayRows,
}: {
  fees: Fee[];
  cashiers: Cashier[];
  years: Year[];
  grades: string[];
  activeYearId: string;
  actorId: string;
  actorIsAdmin: boolean;
  nextNumber: string;
  today: string;
  todayRows: TodayRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [yearId, setYearId] = useState(activeYearId);
  const [grade, setGrade] = useState(grades[0] ?? "");
  const [section, setSection] = useState("");
  const [options, setOptions] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [lookup, setLookup] = useState("");
  const [hits, setHits] = useState<StudentOption[]>([]);
  const [picked, setPicked] = useState<StudentOption | null>(null);
  const [todayPage, setTodayPage] = useState(1);
  const keepId = useRef("");
  const [months, setMonths] = useState<MonthState[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<CalendarMonthCode[]>([]);
  const [feeId, setFeeId] = useState(fees.find((fee) => fee.category === "PENSION")?.id ?? fees[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<PaymentMethodCode>("CASH");
  const [reference, setReference] = useState("");
  const [bankName, setBankName] = useState<string>(BANKS[0]);
  const [bankDate, setBankDate] = useState(today);
  const [file, setFile] = useState<File | null>(null);
  const [manual, setManual] = useState(false);
  const [manualNumber, setManualNumber] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [cashierId, setCashierId] = useState(actorId);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<PaperReceipt | null>(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState("");

  const fee = fees.find((item) => item.id === feeId);
  const isPension = fee ? pensionKind(fee.category, fee.name) !== null : false;
  const student = options.find((item) => item.id === studentId) ?? (picked?.id === studentId ? picked : null);
  const todayView = paginate(todayRows, todayPage);

  const grouped = useMemo(() => {
    const order: FeeCategoryCode[] = ["PENSION", "SERVICES", "BOOKS", "UNIFORM", "ARREARS"];
    return order
      .map((category) => ({ category, items: fees.filter((item) => item.category === category) }))
      .filter((group) => group.items.length > 0);
  }, [fees]);

  useEffect(() => {
    let cancelled = false;
    setLoadingStudents(true);
    void studentsByCourseAction(yearId, grade, section || undefined).then((rows) => {
      if (cancelled) return;
      setOptions(rows);
      const keep = keepId.current;
      keepId.current = "";
      if (!keep || !rows.some((row) => row.id === keep)) {
        setStudentId("");
        setMonths([]);
        setSelectedMonths([]);
        setPicked(null);
      }
      setLoadingStudents(false);
    });
    return () => {
      cancelled = true;
    };
  }, [yearId, grade, section]);

  useEffect(() => {
    const term = lookup.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchStudentsAction(term, yearId).then((rows) => {
        if (!cancelled) setHits(rows);
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lookup, yearId]);

  function pickFromSearch(row: StudentOption) {
    keepId.current = row.id;
    setPicked(row);
    setLookup("");
    setHits([]);
    setGrade(row.grade);
    setSection(row.section ?? "");
    void chooseStudent(row.id);
  }

  async function chooseStudent(id: string) {
    setStudentId(id);
    setSelectedMonths([]);
    if (!id) {
      setMonths([]);
      return;
    }
    const account = await accountAction(id, yearId);
    setMonths(
      account.months.map((item) => ({
        ...item,
        status: item.status === "PAGADO" || item.status === "ABONO" ? item.status : "PENDIENTE",
      })),
    );
  }

  function toggleMonth(month: CalendarMonthCode, status: MonthState["status"]) {
    if (status === "PAGADO") return;
    setSelectedMonths((current) =>
      current.includes(month) ? current.filter((item) => item !== month) : [...current, month],
    );
  }

  function clearForm() {
    setStudentId("");
    setMonths([]);
    setSelectedMonths([]);
    setAmount("");
    setNotes("");
    setMethod("CASH");
    setReference("");
    setBankName(BANKS[0]);
    setBankDate(today);
    setFile(null);
    setManual(false);
    setManualNumber("");
    setIssueDate(today);
    setError("");
  }

  function submit() {
    if (!student) {
      setError("Elige el curso y luego el estudiante.");
      return;
    }
    const chosen = isPension ? selectedMonths : selectedMonths.slice(0, 1);
    if (isPension && chosen.length === 0) {
      setError("Marca el mes o los meses de la pensión.");
      return;
    }
    if (!isPension && chosen.length === 0) {
      setError("Elige el mes del rubro.");
      return;
    }
    const body = new FormData();
    body.set("studentId", student.id);
    body.set("academicYearId", yearId);
    body.set("feeCatalogId", feeId);
    for (const month of chosen) body.append("coveredMonths", month);
    body.set("amount", amount);
    body.set("issueDate", issueDate);
    body.set("receiptNumber", manual ? manualNumber : "");
    body.set("paymentMethod", method);
    body.set("referenceNumber", reference);
    body.set("bankName", bankName);
    body.set("bankDate", bankDate);
    body.set("cashierId", cashierId);
    body.set("notes", notes);
    if (file) body.set("voucher", file);
    setError("");
    startTransition(async () => {
      const result = await issueReceiptAction(body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIssued(result.receipt);
      clearForm();
      router.refresh();
    });
  }

  function voidLast() {
    const body = new FormData();
    body.set("reason", voidReason);
    setVoidError("");
    startTransition(async () => {
      const result = await voidLastReceiptAction(body);
      if (!result.ok) {
        setVoidError(result.error);
        return;
      }
      setVoidOpen(false);
      setVoidReason("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-wide text-pine uppercase">Registro de recibo</p>
        <h1 className="font-serif text-3xl">Caja</h1>
      </div>

      <section className="overflow-hidden rounded border border-line bg-card shadow-sm">
        <h2 className="bg-pine px-4 py-2 text-sm font-semibold text-white">1. Estudiante</h2>
        <div className="grid gap-3 p-4 md:grid-cols-4">
          <div>
            <Label htmlFor="anio">Año lectivo</Label>
            <select id="anio" className={selectClass} value={yearId} onChange={(event) => setYearId(event.target.value)}>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="curso">Curso</Label>
            <select id="curso" className={selectClass} value={grade} onChange={(event) => setGrade(event.target.value)}>
              {grades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="paralelo">Paralelo</Label>
            <select id="paralelo" className={selectClass} value={section} onChange={(event) => setSection(event.target.value)}>
              <option value="">Todos</option>
              {SECTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="estudiante">Estudiante</Label>
            <select id="estudiante" className={selectClass} value={studentId} onChange={(event) => void chooseStudent(event.target.value)}>
              <option value="">
                {loadingStudents ? "Cargando estudiantes…" : options.length ? "Elige un estudiante" : "Sin estudiantes en este curso"}
              </option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.section ? `${item.section} · ` : ""}
                  {item.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Label htmlFor="buscar">Buscar por nombre o cédula</Label>
          <Input
            id="buscar"
            className="mt-1.5"
            value={lookup}
            placeholder="Escribe al menos dos letras. El curso se ajusta solo."
            onChange={(event) => setLookup(event.target.value)}
          />
          {hits.length > 0 ? (
            <ul className="mt-2 overflow-hidden rounded border border-line bg-white">
              {hits.map((hit) => (
                <li key={hit.id} className="border-t border-line first:border-t-0">
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-moss" type="button" onClick={() => pickFromSearch(hit)}>
                    <span className="font-semibold">{hit.fullName}</span>
                    <span className="block text-xs text-muted">
                      {hit.grade}
                      {hit.section ? ` · ${hit.section}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {student ? (
          <p className="px-4 pb-4 text-sm text-muted">
            {student.fullName} · {student.grade}
            {student.section ? ` ${student.section}` : ""} · {student.specialtyLabel}
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded border border-line bg-card shadow-sm">
        <h2 className="bg-pine px-4 py-2 text-sm font-semibold text-white">2. Meses de la pensión</h2>
        <div className="p-4">
          {!student ? <p className="text-sm text-muted">Elige un estudiante para ver qué meses están pendientes, con abono o pagados.</p> : null}
          {student ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {months.map((item) => {
                const code = item.month as CalendarMonthCode;
                const checked = selectedMonths.includes(code);
                const locked = item.status === "PAGADO";
                const tone =
                  item.status === "PAGADO"
                    ? "border-paid bg-moss text-paid"
                    : item.status === "ABONO"
                      ? "border-warn bg-warn-soft text-warn"
                      : "border-danger/40 bg-danger-soft text-danger";
                return (
                  <label key={item.month} className={`flex cursor-pointer items-start gap-2 rounded border p-2 text-sm ${tone} ${locked ? "cursor-not-allowed opacity-80" : ""}`}>
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={locked || checked}
                      disabled={locked || !isPension}
                      onChange={() => toggleMonth(code, item.status)}
                    />
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="block text-xs">
                        {item.status === "PAGADO" ? "Pagado" : item.status === "ABONO" ? `Abono ${formatUsd(item.total)}` : "Pendiente"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : null}
          {student && !isPension ? (
            <div className="mt-3 max-w-xs">
              <Label htmlFor="mes-unico">Mes del rubro</Label>
              <select
                id="mes-unico"
                className={selectClass}
                value={selectedMonths[0] ?? ""}
                onChange={(event) => setSelectedMonths(event.target.value ? [event.target.value as CalendarMonthCode] : [])}
              >
                <option value="">Elige el mes</option>
                {CALENDAR_MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {monthLabel(month)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {student && isPension ? (
            <p className="mt-3 text-sm text-muted">Marca uno o varios meses. Un mes pagado no se vuelve a cobrar.</p>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded border border-line bg-card shadow-sm">
        <div className="flex items-center justify-between bg-pine px-4 py-2 text-white">
          <h2 className="text-sm font-semibold">3. Pago</h2>
          <span className="text-xs">Siguiente recibo {nextNumber}</span>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <div>
            <Label htmlFor="concepto">Concepto</Label>
            <select id="concepto" className={selectClass} value={feeId} onChange={(event) => setFeeId(event.target.value)}>
              {grouped.map((group) => (
                <optgroup key={group.category} label={categoryLabel(group.category)}>
                  {group.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="cantidad">Monto pagado (USD)</Label>
            <Input id="cantidad" className="mt-1.5" inputMode="decimal" value={amount} placeholder="0.00" onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" className="mt-1.5" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="numero">N. recibo</Label>
            <div className="mt-1.5 flex gap-2">
              <Input id="numero" value={manual ? manualNumber : nextNumber} disabled={!manual} onChange={(event) => setManualNumber(event.target.value)} />
              <Button type="button" variant="secondary" onClick={() => setManual((value) => !value)}>
                {manual ? "Automático" : "Manual"}
              </Button>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="nota">Nota</Label>
            <Input id="nota" className="mt-1.5" value={notes} placeholder="Beca, observación" onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <div className="px-4 pb-4">
          <p className="text-sm font-semibold">Forma de pago</p>
          <div className="mt-2 flex gap-2">
            {CASHIER_METHODS.map((item) => (
              <button
                key={item.code}
                type="button"
                className={method === item.code ? "rounded bg-pine px-4 py-2 text-sm font-semibold text-white" : "rounded border border-line bg-white px-4 py-2 text-sm"}
                onClick={() => setMethod(item.code)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {needsBankDetail(method) ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="banco">Banco</Label>
                <select id="banco" className={selectClass} value={bankName} onChange={(event) => setBankName(event.target.value)}>
                  {BANKS.map((bank) => (
                    <option key={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="referencia">N. de comprobante</Label>
                <Input id="referencia" className="mt-1.5" value={reference} onChange={(event) => setReference(event.target.value)} />
              </div>
              <div>
                <Label htmlFor="fecha-banco">Fecha de la transferencia</Label>
                <Input id="fecha-banco" className="mt-1.5" type="date" value={bankDate} onChange={(event) => setBankDate(event.target.value)} />
              </div>
              <div>
                <input
                  id="voucher"
                  className="hidden"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="voucher"
                  className="mt-6 flex h-14 cursor-pointer items-center justify-center rounded bg-pine text-base font-semibold text-white hover:bg-pine-2"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const dropped = event.dataTransfer.files[0];
                    if (dropped) setFile(dropped);
                  }}
                >
                  Adjuntar comprobante
                </label>
                <p className="mt-1 text-sm text-muted">{file ? file.name : "PDF, JPG o PNG. También puedes soltarlo sobre el botón."}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Efectivo: escribe el monto y registra el pago.</p>
          )}
        </div>
        <div className="grid gap-3 border-t border-line p-4 md:grid-cols-2">
          <div>
            <Label htmlFor="colectora">Colectora en turno</Label>
            <select id="colectora" className={selectClass} value={cashierId} disabled={!actorIsAdmin} onChange={(event) => setCashierId(event.target.value)}>
              {cashiers
                .filter((cashier) => actorIsAdmin || cashier.id === actorId)
                .map((cashier) => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name} · {cashier.jobTitle}
                  </option>
                ))}
            </select>
          </div>
        </div>
        {error ? <p className="px-4 pb-2 text-sm text-danger">{error}</p> : null}
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          <Button type="button" size="lg" disabled={pending} onClick={submit}>
            {pending ? "Guardando…" : "Registrar pago"}
          </Button>
          <Button type="button" size="lg" variant="secondary" onClick={clearForm}>
            Limpiar
          </Button>
          <Button type="button" size="lg" variant="danger" onClick={() => setVoidOpen(true)}>
            Anular último recibo
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded border border-line bg-card shadow-sm">
        <h2 className="border-b border-line px-4 py-2 text-sm font-semibold">Recibos de hoy</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Recibo</th>
                <th className="px-3 py-2 font-medium">Estudiante</th>
                <th className="px-3 py-2 font-medium">Concepto</th>
                <th className="px-3 py-2 font-medium">Monto</th>
                <th className="px-3 py-2 font-medium">Pago</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {todayView.rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-muted" colSpan={6}>
                    Todavía no hay recibos con la fecha de hoy.
                  </td>
                </tr>
              ) : (
                todayView.rows.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      <a className="font-semibold text-pine" href={`/recibos/${row.id}`}>
                        {row.receiptNumber}
                      </a>
                    </td>
                    <td className="px-3 py-2">{row.fullName}</td>
                    <td className="px-3 py-2">{row.concept}</td>
                    <td className="px-3 py-2">{formatUsd(row.amount)}</td>
                    <td className="px-3 py-2">{row.method}</td>
                    <td className="px-3 py-2">{row.status === "VOIDED" ? "Anulado" : "Emitido"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {todayView.pages > 1 ? (
          <div className="flex items-center justify-between border-t border-line px-3 py-2 text-sm">
            <span className="text-muted">
              {todayView.from}–{todayView.to} de {todayView.total}
            </span>
            <div className="flex gap-2">
              <button className="rounded border border-line px-3 py-1" type="button" disabled={todayView.page === 1} onClick={() => setTodayPage((page) => page - 1)}>
                Anterior
              </button>
              <button className="rounded border border-line px-3 py-1" type="button" disabled={todayView.page === todayView.pages} onClick={() => setTodayPage((page) => page + 1)}>
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <Dialog open={Boolean(issued)} onOpenChange={(open) => !open && setIssued(null)}>
        <DialogContent className="w-[min(560px,calc(100vw-1.5rem))]">
          <DialogTitle className="font-serif text-xl">Recibo emitido</DialogTitle>
          <DialogDescription className="text-sm text-muted">Revisa el comprobante y envíalo a imprimir o descárgalo.</DialogDescription>
          {issued ? (
            <div className="mt-3 space-y-3">
              <ReceiptPaper receipt={issued} />
              <div className="flex gap-2 no-print">
                <Button type="button" onClick={() => window.print()}>
                  Imprimir
                </Button>
                <Button type="button" variant="secondary" onClick={() => void downloadReceiptPdf(issued)}>
                  Descargar PDF
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogTitle className="font-serif text-xl">Anular el último recibo</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted">
            {actorIsAdmin ? "Se anula el último recibo emitido de la caja." : "Se anula tu último recibo emitido."} Queda el motivo y quién lo anuló.
          </DialogDescription>
          <Label className="mt-3" htmlFor="motivo">
            Motivo
          </Label>
          <textarea id="motivo" className="mt-1.5 min-h-24 w-full rounded border border-line p-3 text-sm" value={voidReason} onChange={(event) => setVoidReason(event.target.value)} />
          {voidError ? <p className="mt-2 text-sm text-danger">{voidError}</p> : null}
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="danger" disabled={pending} onClick={voidLast}>
              Confirmar anulación
            </Button>
            <Button type="button" variant="secondary" onClick={() => setVoidOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
