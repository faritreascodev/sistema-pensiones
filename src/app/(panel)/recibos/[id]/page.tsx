import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiptActions } from "@/components/caja/receipt-actions";
import { ReceiptPaper } from "@/components/caja/receipt-paper";
import { monthLabel } from "@/lib/domain/months";
import { decimalToMoney } from "@/lib/domain/money";
import { specialtyLabel } from "@/lib/domain/specialty";
import { prisma } from "@/server/db";

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { student: true, fee: true, academicYear: true, voucher: true },
  });
  if (!receipt) notFound();
  const months = (receipt.coveredMonths?.length ? receipt.coveredMonths : [receipt.coveredMonth]).map((month) => monthLabel(month));
  const paper = {
    receiptNumber: receipt.receiptNumber,
    issueDate: receipt.issueDate.toISOString().slice(0, 10),
    amount: decimalToMoney(receipt.amount),
    concept: receipt.fee.name,
    month: months.join(", "),
    method: receipt.paymentMethod,
    referenceNumber: receipt.referenceNumber,
    bankName: receipt.bankName,
    notes: receipt.notes,
    studentName: receipt.student.fullName,
    grade: receipt.student.grade,
    section: receipt.student.section,
    specialty: specialtyLabel(receipt.student.specialty),
    cashierName: receipt.cashierName,
    cashierRole: receipt.cashierRole,
    yearName: receipt.academicYear.name,
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link className="text-sm text-pine no-print" href="/reportes">
        Volver a pagos
      </Link>
      {receipt.status === "VOIDED" ? (
        <p className="rounded border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger no-print">
          Anulado. {receipt.voidReason}
        </p>
      ) : null}
      <ReceiptPaper receipt={paper} />
      <ReceiptActions receipt={paper} />
      {receipt.voucher ? (
        <div className="flex gap-3 text-sm no-print">
          <a className="font-semibold text-pine" href={`/api/vouchers/${receipt.voucher.id}`} target="_blank" rel="noreferrer">
            Ver comprobante
          </a>
          <a className="font-semibold text-pine" href={`/api/vouchers/${receipt.voucher.id}?descarga=1`}>
            Descargar comprobante
          </a>
        </div>
      ) : null}
    </div>
  );
}
