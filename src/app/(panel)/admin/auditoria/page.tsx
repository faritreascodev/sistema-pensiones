import { LiveFilters } from "@/components/ui/live-filters";
import { Pager } from "@/components/ui/pager";
import { pageBounds, pageHref } from "@/lib/domain/pagination";
import { prisma } from "@/server/db";

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const where = params.q
    ? {
        OR: [
          { action: { contains: params.q, mode: "insensitive" as const } },
          { detail: { contains: params.q, mode: "insensitive" as const } },
          { actor: { name: { contains: params.q, mode: "insensitive" as const } } },
        ],
      }
    : {};
  const total = await prisma.auditLog.count({ where });
  const bounds = pageBounds(Number(params.page || 1), total);
  const logs = await prisma.auditLog.findMany({
    where,
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    skip: bounds.skip,
    take: bounds.take,
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-wide text-pine uppercase">Control</p>
        <h1 className="font-serif text-3xl">Auditoría</h1>
      </div>
      <LiveFilters path="/admin/auditoria" className="max-w-md">
        <input className="h-11 w-full rounded border border-line px-3 text-sm" name="q" defaultValue={params.q ?? ""} placeholder="Buscar acción, persona o detalle" aria-label="Buscar" />
      </LiveFilters>
      <div className="overflow-x-auto rounded border border-line bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Cuándo</th>
              <th className="px-3 py-2 font-medium">Quién</th>
              <th className="px-3 py-2 font-medium">Acción</th>
              <th className="px-3 py-2 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-line">
                <td className="px-3 py-2 whitespace-nowrap">{log.createdAt.toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}</td>
                <td className="px-3 py-2">{log.actor?.name ?? "Sistema"}</td>
                <td className="px-3 py-2">{log.action}</td>
                <td className="px-3 py-2">{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={bounds.page} pages={bounds.pages} total={bounds.total} from={bounds.from} to={bounds.to} href={(page) => pageHref("/admin/auditoria", { q: params.q }, page)} />
    </div>
  );
}
