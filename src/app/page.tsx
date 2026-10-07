import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center">
      <Link className="text-pine" href="/login">
        Entrar al sistema
      </Link>
    </main>
  );
}
