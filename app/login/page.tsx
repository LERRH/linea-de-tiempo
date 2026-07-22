"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-surface px-4">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm rounded-xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-brand-ink">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
          />
          <input
            type="password"
            placeholder="Contraseña"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-brand-primary px-3 py-2 font-medium text-white transition-colors hover:bg-brand-primaryDark disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-brand-accent hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
