"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FEE_CATEGORIES, type FeeCategoryCode } from "@/lib/domain/fees";
import { deleteFeeAction, saveFeeAction } from "@/server/actions/admin";

export function FeeForm({
  fee,
}: {
  fee?: { id: string; name: string; category: FeeCategoryCode; baseAmount: string; active: boolean };
}) {
  const [state, action, pending] = useActionState(saveFeeAction, null);
  return (
    <form action={action} className="grid items-end gap-2 border-t border-line py-3 sm:grid-cols-6">
      {fee ? <input type="hidden" name="id" value={fee.id} /> : null}
      <Input name="name" className="sm:col-span-2" required defaultValue={fee?.name} placeholder="Nombre del concepto" />
      <select name="category" className="h-11 rounded-md border border-line bg-white px-2 text-sm" defaultValue={fee?.category ?? "SERVICES"}>
        {FEE_CATEGORIES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      <Input name="baseAmount" defaultValue={fee?.baseAmount ?? ""} placeholder="Monto libre" />
      <label className="flex h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={fee?.active ?? true} />
        Activo
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        {fee ? "Actualizar" : "Crear concepto"}
      </Button>
      {fee ? (
        <button className="text-sm text-danger" formAction={deleteFeeAction} type="submit">
          Eliminar
        </button>
      ) : null}
      {state?.error ? <p className="text-sm text-danger sm:col-span-6">{state.error}</p> : null}
    </form>
  );
}
