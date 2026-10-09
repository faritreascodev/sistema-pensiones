"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteUserAction, saveUserAction } from "@/server/actions/admin";

export function UserForm({
  user,
}: {
  user?: { id: string; name: string; email: string; role: string; jobTitle: string; active: boolean };
}) {
  const [state, action, pending] = useActionState(saveUserAction, null);
  return (
    <form action={action} className="grid gap-2 rounded-lg border border-line bg-card p-3 sm:grid-cols-6">
      {user ? <input type="hidden" name="id" value={user.id} /> : null}
      <div className="sm:col-span-2">
        <Label htmlFor={`name-${user?.id ?? "new"}`}>Nombre</Label>
        <Input id={`name-${user?.id ?? "new"}`} name="name" className="mt-1" required defaultValue={user?.name} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`email-${user?.id ?? "new"}`}>Correo</Label>
        <Input id={`email-${user?.id ?? "new"}`} name="email" type="email" className="mt-1" required defaultValue={user?.email} />
      </div>
      <div>
        <Label htmlFor={`role-${user?.id ?? "new"}`}>Rol</Label>
        <select id={`role-${user?.id ?? "new"}`} name="role" className="mt-1 h-11 w-full rounded-md border border-line bg-white px-2 text-sm" defaultValue={user?.role ?? "COLLECTOR"}>
          <option value="COLLECTOR">Colectora</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <div>
        <Label htmlFor={`job-${user?.id ?? "new"}`}>Cargo</Label>
        <Input id={`job-${user?.id ?? "new"}`} name="jobTitle" className="mt-1" required defaultValue={user?.jobTitle ?? "Colectora"} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`pass-${user?.id ?? "new"}`}>{user ? "Nueva clave" : "Clave"}</Label>
        <Input id={`pass-${user?.id ?? "new"}`} name="password" type="password" className="mt-1" placeholder={user ? "Vacío: no cambia" : "Mínimo 8"} />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={user?.active ?? true} />
        Activo
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {user ? "Actualizar usuario" : "Crear usuario"}
        </Button>
        {user ? (
          <button className="ml-3 text-sm text-danger" formAction={deleteUserAction} type="submit">
            Eliminar
          </button>
        ) : null}
      </div>
      {state?.error ? <p className="text-sm text-danger sm:col-span-6">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-paid sm:col-span-6">Usuario guardado.</p> : null}
    </form>
  );
}
