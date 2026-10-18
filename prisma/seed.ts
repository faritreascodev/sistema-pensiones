import { existsSync } from "node:fs";
import { hashPassword } from "../src/lib/auth/password";
import { FEE_CATALOG } from "../src/lib/domain/fees";
import { GRADES } from "../src/lib/domain/grades";
import { span } from "../src/lib/domain/school-year";
import { prisma } from "../src/server/db";
import { writeAudit } from "../src/server/audit";
import {
  importHistoricalReceipts,
  importStudents,
  readWorkbook,
  receiptsFromWorkbook,
  studentsFromWorkbook,
} from "../src/server/workbook";

const EXCEL = process.env.EXCEL_SOURCE || "C:\\Users\\Farit Reasco\\Downloads\\Registro-pensiones.xlsm";

async function main() {
  if ((await prisma.user.count()) > 0) {
    console.log("La base ya tiene datos. Seed omitido.");
    return;
  }

  await prisma.institution.create({
    data: {
      id: "default",
      name: "Unidad Educativa Fiscomisional Monseñor Ángel Barbisotti",
      city: "Esmeraldas",
      phone: "062720000",
    },
  });

  const passwordAdmin = hashPassword("Admin2026!");
  const passwordCaja = hashPassword("Caja2026!");
  await prisma.user.create({
    data: {
      name: "Administración",
      email: "admin@uef-barbisotti.local",
      passwordHash: passwordAdmin,
      role: "ADMIN",
      jobTitle: "Administrador",
    },
  });
  const nubia = await prisma.user.create({
    data: {
      name: "Nubia Loor",
      email: "nubia.loor@uef-barbisotti.local",
      passwordHash: passwordCaja,
      role: "COLLECTOR",
      jobTitle: "Colectora",
    },
  });
  await prisma.user.create({
    data: {
      name: "Sayira Hinojosa",
      email: "sayira.hinojosa@uef-barbisotti.local",
      passwordHash: passwordCaja,
      role: "COLLECTOR",
      jobTitle: "Colectora",
    },
  });

  for (const start of [2024, 2025, 2026]) {
    const year = span(start);
    await prisma.academicYear.create({
      data: {
        name: year.name,
        startYear: year.startYear,
        endYear: year.endYear,
        startsOn: new Date(`${year.startsOn}T00:00:00.000Z`),
        endsOn: new Date(`${year.endsOn}T00:00:00.000Z`),
        active: start === 2026,
      },
    });
  }

  await prisma.grade.createMany({
    data: GRADES.map((name, index) => ({ name, sortOrder: index + 1 })),
  });
  await prisma.feeCatalog.createMany({ data: FEE_CATALOG });

  const active = await prisma.academicYear.findFirstOrThrow({ where: { active: true } });
  if (!existsSync(EXCEL)) {
    console.log(`No está el Excel en ${EXCEL}. Quedaron usuarios, cursos y catálogo.`);
    return;
  }

  const workbook = await readWorkbook(EXCEL);
  const students = studentsFromWorkbook(workbook);
  const studentResult = await importStudents(students, active.id);
  const receiptResult = await importHistoricalReceipts(receiptsFromWorkbook(workbook), nubia.id);
  await writeAudit(prisma, {
    action: "IMPORTAR_EXCEL",
    entity: "Workbook",
    detail: `${studentResult.inserted} estudiantes, ${receiptResult.inserted} recibos históricos`,
  });
  console.log(studentResult, receiptResult);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
