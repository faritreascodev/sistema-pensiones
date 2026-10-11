import { StudentEditor } from "@/components/estudiantes/student-editor";
import { prisma } from "@/server/db";

export default async function NuevoEstudiantePage() {
  const [years, grades] = await Promise.all([
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const active = years.find((year) => year.active) ?? years[0];
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Nuevo estudiante</h1>
      <div className="rounded-lg border border-line bg-card p-4">
        <StudentEditor
          years={years}
          grades={grades.map((grade) => grade.name)}
          student={{
            fullName: "",
            idCard: "",
            grade: grades[0]?.name ?? "Inicial",
            section: "A",
            specialty: "",
            status: "ACTIVE",
            academicYearId: active?.id ?? "",
          }}
        />
      </div>
    </div>
  );
}
