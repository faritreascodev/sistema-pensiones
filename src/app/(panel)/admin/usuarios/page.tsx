import { UserForm } from "@/components/admin/user-form";
import { prisma } from "@/server/db";

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-gold uppercase">Administración</p>
        <h1 className="font-serif text-3xl">Usuarios</h1>
        <p className="text-sm text-muted">Crear, actualizar o eliminar. Si el usuario ya cobró, solo se puede desactivar.</p>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>
      <UserForm />
      {users.map((user) => (
        <UserForm key={user.id} user={user} />
      ))}
    </div>
  );
}
