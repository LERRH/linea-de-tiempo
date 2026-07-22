"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

interface OwnedTimeline {
  id: string;
  title: string;
  updatedAt: string;
}

interface SharedTimeline extends OwnedTimeline {
  owner: { email: string; name: string | null };
  shares: { permission: "VIEW" | "EDIT" }[];
}

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [owned, setOwned] = useState<OwnedTimeline[]>([]);
  const [shared, setShared] = useState<SharedTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/timelines");
    if (res.ok) {
      const data = await res.json();
      setOwned(data.owned);
      setShared(data.shared);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function createTimeline() {
    setCreating(true);
    const res = await fetch("/api/timelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nueva línea de tiempo" }),
    });
    const timeline = await res.json();
    setCreating(false);
    router.push(`/timelines/${timeline.id}`);
  }

  return (
    <main className="min-h-screen bg-brand-surface">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{userEmail}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-brand-ink">Mis líneas de tiempo</h1>
          <button
            onClick={createTimeline}
            disabled={creating}
            className="rounded bg-brand-coral px-4 py-2 font-medium text-white transition-colors hover:bg-brand-coralDark disabled:opacity-50"
          >
            {creating ? "Creando..." : "+ Nueva línea de tiempo"}
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="mb-3 text-lg font-medium text-brand-ink">Mías</h2>
              {owned.length === 0 && <p className="text-sm text-slate-500">Aún no tienes líneas de tiempo.</p>}
              <ul className="flex flex-col gap-2">
                {owned.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/timelines/${t.id}`}
                      className="block rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-brand-accent"
                    >
                      <span className="font-medium text-brand-ink">{t.title}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        Actualizado {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium text-brand-ink">Compartidas conmigo</h2>
              {shared.length === 0 && (
                <p className="text-sm text-slate-500">Nadie ha compartido líneas de tiempo contigo todavía.</p>
              )}
              <ul className="flex flex-col gap-2">
                {shared.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/timelines/${t.id}`}
                      className="block rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-brand-accent"
                    >
                      <span className="font-medium text-brand-ink">{t.title}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        de {t.owner.name || t.owner.email} ·{" "}
                        {t.shares[0]?.permission === "EDIT" ? "puede editar" : "solo ver"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
