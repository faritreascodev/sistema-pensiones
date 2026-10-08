import { SCHOOL } from "@/lib/domain/school";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="bg-pine px-4 py-8 text-center text-white">
        <p className="text-xs tracking-[0.18em] uppercase">{SCHOOL.institution}</p>
        <h1 className="mt-1 font-serif text-3xl">{SCHOOL.name}</h1>
        <p className="mt-1 text-sm text-white/80">{SCHOOL.city}</p>
      </div>
      <section className="mx-auto mt-8 w-full max-w-md rounded border border-line bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-2xl text-ink">Ingresar</h2>
        <LoginForm />
      </section>
      <p className="mx-auto mt-8 max-w-md px-4 text-center text-sm text-ink">
        “Para llenar las iglesias, hay que llenar primero las escuelas.”
        <span className="mt-1 block text-pine">Mons. Ángel Barbisotti</span>
      </p>
    </main>
  );
}
