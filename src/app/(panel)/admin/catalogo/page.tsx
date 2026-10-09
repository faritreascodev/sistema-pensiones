import { FeeForm } from "@/components/admin/fee-form";
import { categoryLabel } from "@/lib/domain/fees";
import { decimalToMoney } from "@/lib/domain/money";
import { prisma } from "@/server/db";

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const fees = await prisma.feeCatalog.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <div>
      <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Lista de rubros</p>
      <h1 className="font-serif text-3xl">Catálogo</h1>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <p className="mt-1 text-sm text-muted">Si el monto base queda vacío, caja escribe la cantidad en cada recibo.</p>
      <div className="mt-4 rounded-lg border border-line bg-card px-3">
        <FeeForm />
        {fees.map((fee) => (
          <div key={fee.id}>
            <p className="pt-3 text-xs text-muted">{categoryLabel(fee.category)}</p>
            <FeeForm
              fee={{
                id: fee.id,
                name: fee.name,
                category: fee.category,
                baseAmount: fee.baseAmount ? decimalToMoney(fee.baseAmount) : "",
                active: fee.active,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
