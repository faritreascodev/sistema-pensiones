import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentEditor } from "@/components/estudiantes/student-editor";
import { Pager } from "@/components/ui/pager";
import { paginate } from "@/lib/domain/pagination";
import { formatShortDate } from "@/lib/domain/dates";
import { formatUsd } from "@/lib/domain/money";
import { paymentLabel } from "@/lib/domain/payments";
import { prisma } from "@/server/db";
import { getStudentAccount } from "@/server/receipts";
import { currentUser } from "@/server/current-user";

export default async function EstudiantePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await currentUser();
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();
  const [years, grades, account] = await Promise.all([
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
    getStudentAccount(student.id),
  ]);
  const receipts = paginate(account.receipts, Number(query.page || 1));

  return (
    <div className="space-y-6">
      <Link className="text-sm text-pine" href="/estudiantes">
        Volver a la matrícula
      </Link>
      <div>
        <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Estado de cuenta</p>
        <h1 className="font-serif text-3xl">{student.fullName}</h1>
      </div>
      <div className="rounded-lg border border-line bg-card p-4">
        <StudentEditor
          years={years}
          canDelete={user?.role === "ADMIN"}
          grades={grades.map((grade) => grade.name)}
          student={{
            id: student.id,
            fullName: student.fullName,
            idCard: student.idCard ?? "",
            grade: student.grade,
            section: student.section ?? "",
            specialty: student.specialty ?? "",
            status: student.status,
            academicYearId: student.academicYearId ?? years.find((year) => year.active)?.id ?? "",
          }}
        />
      </div>
      <section>
        <h2 className="font-serif text-xl">Pensiones {account.year?.name ?? ""}</h2>
        <p className="text-sm text-muted">Mayo a febrero. Un mes con registro ya tiene al menos un abono emitido.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {account.months.map((month) => (
            <div
              key={month.month}
              className={
                month.status === "PAGADO"
                  ? "rounded border border-paid bg-moss p-3 text-paid"
                  : month.status === "ABONO"
                    ? "rounded border border-warn bg-warn-soft p-3 text-warn"
                    : "rounded border border-danger/40 bg-danger-soft p-3 text-danger"
              }
            >
              <p className="text-sm font-semibold">{month.label}</p>
              <p className="text-sm">
                {month.status === "PAGADO" ? "Pagado" : month.status === "ABONO" ? `Abono ${formatUsd(month.total)}` : "Pendiente"}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Recibo</th>
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 font-medium">Mes</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Pago</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {receipts.rows.map((receipt) => (
              <tr key={receipt.id} className="border-t border-line">
                <td className="px-3 py-2">{formatShortDate(receipt.issueDate)}</td>
                <td className="px-3 py-2">
                  <a className="font-semibold text-pine" href={`/recibos/${receipt.id}`}>
                    {receipt.receiptNumber}
                  </a>
                </td>
                <td className="px-3 py-2">{receipt.concept}</td>
                <td className="px-3 py-2">
                  {receipt.month}
                  <span className="block text-xs text-muted">{receipt.yearName}</span>
                </td>
                <td className="px-3 py-2">{formatUsd(receipt.amount)}</td>
                <td className="px-3 py-2">{paymentLabel(receipt.method)}</td>
                <td className="px-3 py-2">{receipt.status === "VOIDED" ? "Anulado" : "Emitido"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Pager
        page={receipts.page}
        pages={receipts.pages}
        total={receipts.total}
        from={receipts.from}
        to={receipts.to}
        href={(page) => (page > 1 ? `/estudiantes/${student.id}?page=${page}` : `/estudiantes/${student.id}`)}
      />
    </div>
  );
}
