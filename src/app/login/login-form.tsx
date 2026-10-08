"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required placeholder="tu.correo@uef-barbisotti.local" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Clave</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button className="w-full" size="lg" type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar a caja"}
      </Button>
    </form>
  );
}
