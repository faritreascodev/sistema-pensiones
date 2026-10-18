import { existsSync } from "node:fs";
import { prisma } from "../src/server/db";
import { importHistoricalReceipts, readWorkbook, receiptsFromWorkbook } from "../src/server/workbook";

const excel = process.env.EXCEL_SOURCE || "C:\\Users\\Farit Reasco\\Downloads\\Registro-pensiones.xlsm";

async function main() {
  if (!existsSync(excel)) throw new Error("No está el Excel");
  const nubia = await prisma.user.findUniqueOrThrow({ where: { email: "nubia.loor@uef-barbisotti.local" } });
  const workbook = await readWorkbook(excel);
  const rows = receiptsFromWorkbook(workbook);
  const result = await importHistoricalReceipts(rows, nubia.id);
  const total = await prisma.receipt.count();
  console.log({ parsed: rows.length, ...result, total });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
