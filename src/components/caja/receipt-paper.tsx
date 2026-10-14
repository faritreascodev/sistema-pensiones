import { formatLongDate } from "@/lib/domain/dates";
import { paymentLabel, type PaymentMethodCode } from "@/lib/domain/payments";
import { SCHOOL } from "@/lib/domain/school";
import { formatUsd } from "@/lib/domain/money";

export type PaperReceipt = {
  receiptNumber: string;
  issueDate: string;
  amount: string;
  concept: string;
  month: string;
  method: PaymentMethodCode;
  referenceNumber?: string | null;
  bankName?: string | null;
  notes?: string | null;
  studentName: string;
  grade: string;
  section?: string | null;
  specialty: string;
  cashierName: string;
  cashierRole: string;
  yearName: string;
};

export function ReceiptPaper({ receipt }: { receipt: PaperReceipt }) {
  return (
    <article data-receipt-sheet className="rounded-md border border-ink/80 bg-white px-5 py-4 text-ink">
      <p className="text-center text-[11px] tracking-[0.18em] text-gold uppercase">{SCHOOL.institution}</p>
      <h2 className="text-center font-serif text-xl">{SCHOOL.name}</h2>
      <p className="text-center text-xs text-muted">{SCHOOL.city} · Año lectivo {receipt.yearName}</p>
      <p className="mt-3 text-center text-sm font-semibold tracking-wide">REGISTRO DE RECIBO DE PAGOS POR CONCEPTOS</p>
      <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-1.5 text-sm">
        <dt className="text-muted">Recibo</dt>
        <dd className="font-semibold">{receipt.receiptNumber}</dd>
        <dt className="text-muted">Fecha</dt>
        <dd>{formatLongDate(receipt.issueDate)}</dd>
        <dt className="text-muted">Estudiante</dt>
        <dd>{receipt.studentName}</dd>
        <dt className="text-muted">Curso</dt>
        <dd>
          {receipt.grade}
          {receipt.section ? ` · Paralelo ${receipt.section}` : ""} · {receipt.specialty}
        </dd>
        <dt className="text-muted">Concepto</dt>
        <dd>{receipt.concept}</dd>
        <dt className="text-muted">Mes de abono</dt>
        <dd>{receipt.month}</dd>
        <dt className="text-muted">Cantidad</dt>
        <dd className="font-semibold">{formatUsd(receipt.amount)}</dd>
        <dt className="text-muted">Forma de pago</dt>
        <dd>
          {paymentLabel(receipt.method)}
          {receipt.referenceNumber ? ` · ${receipt.referenceNumber}` : ""}
          {receipt.bankName ? ` · ${receipt.bankName}` : ""}
        </dd>
        <dt className="text-muted">Nota</dt>
        <dd>{receipt.notes || "—"}</dd>
        <dt className="text-muted">Atención</dt>
        <dd>
          {receipt.cashierName} · {receipt.cashierRole}
        </dd>
      </dl>
    </article>
  );
}
