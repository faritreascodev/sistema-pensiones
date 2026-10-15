import { LiveFilters } from "@/components/ui/live-filters";
import { Pager } from "@/components/ui/pager";
import { formatShortDate } from "@/lib/domain/dates";
import { decimalToMoney, formatUsd } from "@/lib/domain/money";
import { pageBounds, pageHref } from "@/lib/domain/pagination";
import type { Prisma } from "@prisma/client";
import { reviewVoucherAction } from "@/server/actions/admin";
import { currentUser } from "@/server/current-user";
import { prisma } from "@/server/db";

const STATUS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export default async function VouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; anio?: string; q?: string; page?: string }>;
}) {
  const user = await currentUser();
  const params = await searchParams;
  const estado = params.estado;
  const status = estado === "APPROVED" || estado === "REJECTED" || estado === "PENDING" ? estado : undefined;
  const years = await prisma.academicYear.findMany({ orderBy: { startYear: "desc" } });
  const year = years.find((item) => item.id === params.anio) ?? years.find((item) => item.active) ?? years[0];
  const where: Prisma.PaymentVoucherWhereInput = {
    ...(status ? { verificationStatus: status } : {}),
    ...(year ? { receipt: { academicYearId: year.id } } : {}),
    ...(params.q
      ? {
          OR: [
            { student: { fullName: { contains: params.q, mode: "insensitive" as const } } },
            { referenceNumber: { contains: params.q, mode: "insensitive" as const } },
            { bankName: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const total = await prisma.paymentVoucher.count({ where });
  const bounds = pageBounds(Number(params.page || 1), total);
  const vouchers = await prisma.paymentVoucher.findMany({
    where,
    include: { student: true, receipt: true },
    orderBy: { uploadDate: "desc" },
    skip: bounds.skip,
    take: bounds.take,
  });
  const filters = { anio: year?.id, estado, q: params.q };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Conciliación</p>
        <h1 className="font-serif text-3xl">Comprobantes bancarios</h1>
      </div>
      <LiveFilters path="/vouchers" className="grid gap-2 rounded border border-line bg-card p-3 shadow-sm sm:grid-cols-3">
        <select className="h-11 rounded border border-line bg-white px-3 text-sm" name="anio" defaultValue={year?.id ?? ""} aria-label="Año lectivo">
          {years.map((item) => (
            <option key={item.id} value={item.id}>
              Lectivo {item.name}
            </option>
          ))}
        </select>
        {estado ? <input type="hidden" name="estado" value={estado} /> : null}
        <input className="h-11 rounded border border-line px-3 text-sm sm:col-span-2" name="q" defaultValue={params.q ?? ""} placeholder="Estudiante, banco o referencia" aria-label="Buscar" />
      </LiveFilters>
      <div className="flex gap-2 text-sm">
        {[
          ["", "Todos"],
          ["PENDING", "Pendientes"],
          ["APPROVED", "Aprobados"],
          ["REJECTED", "Rechazados"],
        ].map(([value, label]) => (
          <a key={label} className={estado === value || (!estado && !value) ? "rounded-md bg-pine px-3 py-1.5 text-white" : "rounded-md border border-line px-3 py-1.5"} href={`/vouchers?anio=${year?.id ?? ""}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}${value ? `&estado=${value}` : ""}`}>
            {label}
          </a>
        ))}
      </div>
      <div className="space-y-3">
        {vouchers.length === 0 ? <p className="text-sm text-muted">No hay comprobantes en este filtro.</p> : null}
        {vouchers.map((voucher) => (
          <article key={voucher.id} className="rounded-lg border border-line bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{voucher.student.fullName}</p>
                <p className="text-sm text-muted">
                  {voucher.bankName} · {voucher.referenceNumber} · {formatUsd(decimalToMoney(voucher.amount))}
                </p>
                <p className="text-sm text-muted">
                  {voucher.receipt ? (
                  <a className="font-semibold text-pine" href={`/recibos/${voucher.receipt.id}`}>
                    Recibo {voucher.receipt.receiptNumber}
                  </a>
                ) : (
                  "Sin recibo"
                )}{" "}
                · {formatShortDate(voucher.uploadDate.toISOString())} · {STATUS[voucher.verificationStatus]}
                </p>
                {voucher.reviewNote ? <p className="mt-1 text-sm">Nota: {voucher.reviewNote}</p> : null}
              </div>
              <div className="flex gap-3 text-sm">
                <a className="font-semibold text-pine" href={`/api/vouchers/${voucher.id}`} target="_blank" rel="noreferrer">
                  Ver
                </a>
                <a className="font-semibold text-pine" href={`/api/vouchers/${voucher.id}?descarga=1`}>
                  Descargar
                </a>
              </div>
            </div>
            {user?.role === "ADMIN" && voucher.verificationStatus === "PENDING" ? (
              <form className="mt-3 flex flex-wrap items-center gap-2" action={reviewVoucherAction}>
                <input type="hidden" name="voucherId" value={voucher.id} />
                <input className="h-10 flex-1 rounded-md border border-line px-3 text-sm" name="note" placeholder="Nota de revisión" />
                <button className="rounded-md bg-pine px-3 py-2 text-sm text-white" name="status" value="APPROVED" type="submit">
                  Aprobar
                </button>
                <button className="rounded-md border border-danger/30 px-3 py-2 text-sm text-danger" name="status" value="REJECTED" type="submit">
                  Rechazar
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
      <Pager page={bounds.page} pages={bounds.pages} total={bounds.total} from={bounds.from} to={bounds.to} href={(page) => pageHref("/vouchers", filters, page)} />
    </div>
  );
}
