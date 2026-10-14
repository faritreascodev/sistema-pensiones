import { CashierDesk } from "@/components/caja/cashier-desk";
import { todayInGuayaquil } from "@/lib/domain/dates";
import { decimalToMoney } from "@/lib/domain/money";
import { paymentLabel } from "@/lib/domain/payments";
import { currentUser } from "@/server/current-user";
import { prisma } from "@/server/db";
import { peekReceiptNumber } from "@/server/receipts";

export default async function CajaPage() {
  const user = await currentUser();
  if (!user) return null;
  const today = todayInGuayaquil();
  const [fees, cashiers, nextNumber, todayReceipts, years, grades] = await Promise.all([
    prisma.feeCatalog.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.user.findMany({
      where: { active: true, ...(user.role === "ADMIN" ? {} : { id: user.id }) },
      orderBy: { name: "asc" },
      select: { id: true, name: true, jobTitle: true },
    }),
    peekReceiptNumber(today),
    prisma.receipt.findMany({
      where: { issueDate: new Date(`${today}T00:00:00.000Z`) },
      include: { student: true, fee: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const activeYear = years.find((year) => year.active) ?? years[0];

  return (
    <CashierDesk
      fees={fees.map((fee) => ({
        id: fee.id,
        name: fee.name,
        category: fee.category,
        baseAmount: fee.baseAmount ? decimalToMoney(fee.baseAmount) : null,
      }))}
      cashiers={cashiers}
      years={years.map((year) => ({ id: year.id, name: year.name }))}
      grades={grades.map((grade) => grade.name)}
      activeYearId={activeYear?.id ?? ""}
      actorId={user.id}
      actorIsAdmin={user.role === "ADMIN"}
      nextNumber={nextNumber}
      today={today}
      todayRows={todayReceipts.map((receipt) => ({
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        fullName: receipt.student.fullName,
        concept: receipt.fee.name,
        amount: decimalToMoney(receipt.amount),
        method: paymentLabel(receipt.paymentMethod),
        status: receipt.status,
      }))}
    />
  );
}
