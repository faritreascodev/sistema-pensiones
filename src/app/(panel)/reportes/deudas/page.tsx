import Link from "next/link";
import { LiveFilters } from "@/components/ui/live-filters";
import { Pager } from "@/components/ui/pager";
import { COSTA_MONTHS, monthLabel } from "@/lib/domain/months";
import { pageHref, paginate } from "@/lib/domain/pagination";
import { prisma } from "@/server/db";
import { debtReport } from "@/server/reports";

export default async function DeudasPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; grade?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const [years, grades] = await Promise.all([
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const year = years.find((item) => item.id === params.anio) ?? years.find((item) => item.active) ?? years[0];
  const report = year
    ? await debtReport(year.id, params.grade || undefined, params.q)
    : { rows: [], debtors: [], pendingStudents: 0, clearStudents: 0 };
  const view = paginate(report.rows, Number(params.page || 1));
  const filters = { anio: year?.id, grade: params.grade, q: params.q };
  const debtHref = pageHref("/api/reportes/deudas", { ...filters, solo: "1" }, 1);
  const allHref = pageHref("/api/reportes/deudas", filters, 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-pine uppercase">Cartera</p>
          <h1 className="font-serif text-3xl">Reporte de deudas</h1>
          <p className="text-sm text-muted">
            {report.debtors.length} con deuda o abono · {report.clearStudents} al día en el lectivo {year?.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="inline-flex h-11 items-center rounded border border-pine px-4 text-sm font-semibold text-pine" href={debtHref}>
            Exportar deudores
          </a>
          <a className="inline-flex h-11 items-center rounded border border-line bg-white px-4 text-sm font-semibold" href={allHref}>
            Exportar checklist
          </a>
        </div>
      </div>
      <LiveFilters path="/reportes/deudas" className="grid gap-2 rounded border border-line bg-card p-3 shadow-sm sm:grid-cols-3">
        <select className="h-11 rounded border border-line bg-white px-3 text-sm" name="anio" defaultValue={year?.id ?? ""} aria-label="Año lectivo">
          {years.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select className="h-11 rounded border border-line bg-white px-3 text-sm" name="grade" defaultValue={params.grade ?? ""} aria-label="Curso">
          <option value="">Todos los cursos</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.name}>
              {grade.name}
            </option>
          ))}
        </select>
        <input className="h-11 rounded border border-line px-3 text-sm" name="q" defaultValue={params.q ?? ""} placeholder="Buscar estudiante" aria-label="Buscar" />
      </LiveFilters>
      <p className="text-sm text-muted">Verde: pensión pagada. Ámbar: abono o saldo. Rojo: mes sin pago.</p>
      <div className="overflow-x-auto rounded border border-line bg-card shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-paper text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Estudiante</th>
              {COSTA_MONTHS.map((month) => (
                <th key={month} className="px-2 py-2 font-medium">
                  {monthLabel(month).slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-3 py-2">
                  <Link className="font-semibold text-pine" href={`/estudiantes/${row.id}`}>
                    {row.fullName}
                  </Link>
                  <span className="block text-xs text-muted">
                    {row.grade} {row.section}
                  </span>
                </td>
                {row.months.map((status, index) => (
                  <td key={COSTA_MONTHS[index]} className="px-2 py-2">
                    <span
                      className={
                        status === "PAGADO"
                          ? "rounded bg-moss px-1.5 py-0.5 text-xs font-semibold text-paid"
                          : status === "ABONO"
                            ? "rounded bg-warn-soft px-1.5 py-0.5 text-xs font-semibold text-warn"
                            : "rounded bg-danger-soft px-1.5 py-0.5 text-xs font-semibold text-danger"
                      }
                    >
                      {status === "PAGADO" ? "Pagado" : status === "ABONO" ? "Abono" : "Debe"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={view.page} pages={view.pages} total={view.total} from={view.from} to={view.to} href={(page) => pageHref("/reportes/deudas", filters, page)} />
    </div>
  );
}
