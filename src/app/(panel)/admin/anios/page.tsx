import { activateYearAction, deleteYearAction, openYearAction } from "@/server/actions/admin";
import { prisma } from "@/server/db";
import { formatShortDate } from "@/lib/domain/dates";

export default async function AniosPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const years = await prisma.academicYear.findMany({ orderBy: { startYear: "desc" } });
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Régimen Costa</p>
        <h1 className="font-serif text-3xl">Años lectivos</h1>
        <p className="mt-1 text-sm text-muted">Cada lectivo abre en mayo y cierra en febrero del año siguiente.</p>
        {error ? <p className="mt-2 text-sm text-danger">{error === "anio" ? "Año de inicio inválido." : error}</p> : null}
      </div>
      <form className="flex flex-wrap items-end gap-2" action={openYearAction}>
        <label className="text-sm">
          Año de inicio
          <input className="mt-1 block h-11 rounded-md border border-line px-3" name="startYear" type="number" min={2020} max={2040} defaultValue={2027} />
        </label>
        <button className="h-11 rounded-md bg-pine px-4 text-sm font-semibold text-white" type="submit">
          Crear lectivo
        </button>
      </form>
      <div className="overflow-hidden rounded-lg border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Lectivo</th>
              <th className="px-3 py-2 font-medium">Desde</th>
              <th className="px-3 py-2 font-medium">Hasta</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year.id} className="border-t border-line">
                <td className="px-3 py-2 font-semibold">{year.name}</td>
                <td className="px-3 py-2">{formatShortDate(year.startsOn.toISOString())}</td>
                <td className="px-3 py-2">{formatShortDate(year.endsOn.toISOString())}</td>
                <td className="px-3 py-2">
                  {year.active ? (
                    "Activo"
                  ) : (
                    <form action={activateYearAction}>
                      <input type="hidden" name="id" value={year.id} />
                      <button className="text-pine" type="submit">
                        Activar
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-3 py-2">
                  {year.active ? null : (
                    <form action={deleteYearAction}>
                      <input type="hidden" name="id" value={year.id} />
                      <button className="text-danger" type="submit">
                        Eliminar
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
