import { VoidReceiptButton } from "@/components/reportes/void-receipt-button";
import { LiveFilters } from "@/components/ui/live-filters";
import { Pager } from "@/components/ui/pager";
import { todayInGuayaquil } from "@/lib/domain/dates";
import { formatUsd } from "@/lib/domain/money";
import { pageHref, paginate } from "@/lib/domain/pagination";
import { voidLastReceiptAction } from "@/server/actions/caja";
import { currentUser } from "@/server/current-user";
import { prisma } from "@/server/db";
import { collectionReport } from "@/server/reports";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; cashierId?: string; anulados?: string; anio?: string; q?: string; page?: string }>;
}) {
  const user = await currentUser();
  if (!user) return null;
  const params = await searchParams;
  const years = await prisma.academicYear.findMany({ orderBy: { startYear: "desc" } });
  const chosenYear = years.find((year) => year.id === params.anio);
  const today = todayInGuayaquil();
  const from = chosenYear ? chosenYear.startsOn.toISOString().slice(0, 10) : params.from || today;
  const to = chosenYear ? chosenYear.endsOn.toISOString().slice(0, 10) : params.to || today;
  const cashierId = user.role === "ADMIN" ? params.cashierId || "" : user.id;
  const cashiers = user.role === "ADMIN" ? await prisma.user.findMany({ orderBy: { name: "asc" } }) : [];
  const report = await collectionReport({
    from,
    to,
    cashierId: cashierId || undefined,
    includeVoided: params.anulados === "1",
    q: params.q,
  });
  const view = paginate(report.rows, Number(params.page || 1));
  const excel = `/api/reportes/excel?from=${from}&to=${to}&cashierId=${cashierId}&anulados=${params.anulados === "1" ? "1" : "0"}&q=${encodeURIComponent(params.q ?? "")}`;
  const filters = { anio: params.anio, from, to, cashierId, anulados: params.anulados === "1" ? "1" : undefined, q: params.q };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Arqueo</p>
        <h1 className="font-serif text-3xl">Reporte de pagos</h1>
      </div>
      <LiveFilters key={`${params.anio ?? ""}-${from}-${to}`} path="/reportes" className="grid gap-2 rounded border border-line bg-card p-3 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        <select className="h-11 rounded border border-line bg-white px-3 text-sm" name="anio" defaultValue={params.anio ?? ""}>
          <option value="">Por fechas</option>
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              Lectivo {year.name}
            </option>
          ))}
        </select>
        <input className="h-11 rounded-md border border-line px-3 text-sm" type="date" name="from" defaultValue={from} />
        <input className="h-11 rounded-md border border-line px-3 text-sm" type="date" name="to" defaultValue={to} />
        {user.role === "ADMIN" ? (
          <select className="h-11 rounded-md border border-line bg-white px-3 text-sm" name="cashierId" defaultValue={cashierId}>
            <option value="">Todas las colectoras</option>
            {cashiers.map((cashier) => (
              <option key={cashier.id} value={cashier.id}>
                {cashier.name}
              </option>
            ))}
          </select>
        ) : (
          <input type="hidden" name="cashierId" value={user.id} />
        )}
        <input className="h-11 rounded border border-line px-3 text-sm" name="q" defaultValue={params.q ?? ""} placeholder="Estudiante o n. de recibo" aria-label="Buscar" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="anulados" value="1" defaultChecked={params.anulados === "1"} />
          Incluir anulados
        </label>
      </LiveFilters>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Efectivo", report.totals.cash],
          ["Banco", report.totals.bank],
          ["Cheques", report.totals.check],
          ["Total emitido", report.totals.all],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-card p-4">
            <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
            <p className="mt-1 font-serif text-2xl">{formatUsd(value)}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">
        Banco reúne transferencias ({formatUsd(report.totals.transfer)}) y depósitos ({formatUsd(report.totals.deposit)}).
      </p>
      <a className="inline-flex h-10 items-center rounded-md border border-line bg-card px-4 text-sm font-semibold" href={excel}>
        Exportar Excel
      </a>
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Estudiante</th>
              <th className="px-3 py-2 font-medium">Recibo</th>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 font-medium">Mes</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Pago</th>
              <th className="px-3 py-2 font-medium">Atención</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-3 py-2">
                  {row.fullName}
                  <span className="block text-xs text-muted">
                    {row.grade} {row.section} · {row.specialty}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <a className="font-semibold text-pine" href={`/recibos/${row.id}`}>
                    {row.receiptNumber}
                  </a>
                </td>
                <td className="px-3 py-2">{row.issueDate}</td>
                <td className="px-3 py-2">{row.concept}</td>
                <td className="px-3 py-2">{row.month}</td>
                <td className="px-3 py-2">{formatUsd(row.amount)}</td>
                <td className="px-3 py-2">
                  {row.method}
                  {row.reference ? ` · ${row.reference}` : ""}
                </td>
                <td className="px-3 py-2">
                  {row.cashierName}
                  <span className="block text-xs text-muted">{row.cashierRole}</span>
                </td>
                <td className="px-3 py-2">
                  {row.status === "VOIDED" ? (
                    <span title={row.voidReason}>Anulado</span>
                  ) : user.role === "ADMIN" ? (
                    <VoidReceiptButton receiptId={row.id} action={voidLastReceiptAction} />
                  ) : (
                    "Emitido"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={view.page} pages={view.pages} total={view.total} from={view.from} to={view.to} href={(page) => pageHref("/reportes", filters, page)} />
    </div>
  );
}
