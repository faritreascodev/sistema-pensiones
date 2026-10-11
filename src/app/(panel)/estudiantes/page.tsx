import Link from "next/link";
import { LiveFilters } from "@/components/ui/live-filters";
import { Pager } from "@/components/ui/pager";
import { Button } from "@/components/ui/button";
import { pageHref } from "@/lib/domain/pagination";
import { prisma } from "@/server/db";
import { listStudents } from "@/server/students";

const STATUS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  GRADUATED: "Graduado",
  WITHDRAWN: "Retirado",
};

export default async function EstudiantesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grade?: string; section?: string; page?: string; anio?: string }>;
}) {
  const params = await searchParams;
  const years = await prisma.academicYear.findMany({ orderBy: { startYear: "desc" } });
  const year = years.find((item) => item.id === params.anio) ?? years.find((item) => item.active) ?? years[0];
  const grades = await prisma.grade.findMany({ orderBy: { sortOrder: "asc" } });
  const list = await listStudents({
    q: params.q,
    grade: params.grade,
    section: params.section,
    academicYearId: year?.id,
    page: Number(params.page || 1),
  });
  const filters = { anio: year?.id, q: params.q, grade: params.grade, section: params.section };
  const exportQuery = pageHref("/api/export/estudiantes", filters, 1).replace("/api/export/estudiantes", "");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-pine uppercase">Matrícula</p>
          <h1 className="font-serif text-3xl">Estudiantes</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="inline-flex h-11 items-center rounded border border-pine px-4 text-sm font-semibold text-pine" href={`/api/export/estudiantes${exportQuery}`}>
            Exportar estudiantes
          </a>
          <a className="inline-flex h-11 items-center rounded border border-line bg-white px-4 text-sm font-semibold" href={`/api/export/completo?anio=${year?.id ?? ""}`}>
            Data completa
          </a>
          <Link href="/estudiantes/nuevo">
            <Button>Crear estudiante</Button>
          </Link>
        </div>
      </div>
      <LiveFilters path="/estudiantes" className="grid gap-2 rounded border border-line bg-card p-3 shadow-sm sm:grid-cols-4">
        <select className="h-11 rounded border border-line bg-white px-3 text-sm" name="anio" defaultValue={year?.id ?? ""} aria-label="Año lectivo">
          {years.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <input className="h-11 rounded border border-line px-3 text-sm" name="q" defaultValue={params.q ?? ""} placeholder="Buscar por nombre o cédula" aria-label="Buscar" />
        <select className="h-11 rounded border border-line bg-white px-3 text-sm" name="grade" defaultValue={params.grade ?? ""} aria-label="Curso">
          <option value="">Todos los cursos</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.name}>
              {grade.name}
            </option>
          ))}
        </select>
        <select className="h-11 rounded border border-line bg-white px-3 text-sm" name="section" defaultValue={params.section ?? ""} aria-label="Paralelo">
          <option value="">Todos los paralelos</option>
          <option>A</option>
          <option>B</option>
          <option>C</option>
          <option>D</option>
        </select>
      </LiveFilters>
      <div className="overflow-x-auto rounded border border-line bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Estudiante</th>
              <th className="px-3 py-2 font-medium">Curso</th>
              <th className="px-3 py-2 font-medium">Paralelo</th>
              <th className="px-3 py-2 font-medium">Especialidad</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {list.rows.map((student) => (
              <tr key={student.id} className="border-t border-line">
                <td className="px-3 py-2">
                  <Link className="font-semibold text-pine" href={`/estudiantes/${student.id}`}>
                    {student.fullName}
                  </Link>
                  <span className="block text-xs text-muted">{student.idCard || "Sin cédula"}</span>
                </td>
                <td className="px-3 py-2">{student.grade}</td>
                <td className="px-3 py-2">{student.section || "—"}</td>
                <td className="px-3 py-2">{student.specialty}</td>
                <td className="px-3 py-2">{STATUS[student.status] ?? student.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={list.page} pages={list.pages} total={list.total} from={list.from} to={list.to} href={(page) => pageHref("/estudiantes", filters, page)} />
    </div>
  );
}
