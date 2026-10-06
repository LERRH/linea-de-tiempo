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
  _count: { items: number };
}

interface SharedTimeline extends OwnedTimeline {
  owner: { email: string; name: string | null };
  shares: { permission: "VIEW" | "EDIT" }[];
}

type View = "inicio" | "mias" | "compartidas";

const MENU: { view: View; icon: string; label: string }[] = [
  { view: "inicio", icon: "⌂", label: "Inicio" },
  { view: "mias", icon: "☷", label: "Mis líneas de tiempo" },
  { view: "compartidas", icon: "♧", label: "Compartidas conmigo" },
];

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatEdited(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (d.toDateString() === now.toDateString()) return `Hoy ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function initials(label: string): string {
  const parts = label.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function milestoneCount(n: number): string {
  return `${n} ${n === 1 ? "hito" : "hitos"}`;
}

export default function Dashboard({ userEmail, userName }: { userEmail: string; userName: string }) {
  const router = useRouter();
  const [owned, setOwned] = useState<OwnedTimeline[]>([]);
  const [shared, setShared] = useState<SharedTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<View>("inicio");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/timelines");
    if (res.ok) {
      const data = await res.json();
      setOwned(data.owned);
      setShared(data.shared);
      setError(null);
    } else {
      setError("No se pudieron cargar tus líneas de tiempo. Recarga la página para intentarlo de nuevo.");
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
    if (!res.ok) {
      setCreating(false);
      setError("No se pudo crear la línea de tiempo.");
      return;
    }
    const timeline = await res.json();
    router.push(`/timelines/${timeline.id}`);
  }

  const q = query.trim().toLowerCase();
  const matches = (t: OwnedTimeline) => !q || t.title.toLowerCase().includes(q);
  const ownedShown = owned.filter(matches);
  const sharedShown = shared.filter(matches);
  const me = userName || userEmail;
  const pageTitle = MENU.find((m) => m.view === view)!.label;

  return (
    <div className="app">
      <aside className="sidebar">
        <Logo />
        <nav className="menu">
          {MENU.map((m) => (
            <button key={m.view} className={view === m.view ? "active" : ""} onClick={() => setView(m.view)}>
              <b>{m.icon}</b> <span>{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="small muted mb-2 truncate" title={userEmail}>
            {me}
          </div>
          <button className="btn btn-outline btn-sm w-full" onClick={() => signOut({ callbackUrl: "/" })}>
            Salir
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="page-head">
          <h1>{pageTitle}</h1>
          <button className="btn btn-coral" onClick={createTimeline} disabled={creating}>
            {creating ? "Creando..." : "＋ Nueva línea de tiempo"}
          </button>
        </div>

        <div className="search">
          <input
            className="input"
            placeholder="⌕  Buscar líneas de tiempo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && <p className="error mb-4">{error}</p>}

        {loading ? (
          <div className="card grid gap-4 p-6">
            <div className="loading w-1/2" />
            <div className="loading w-3/4" />
            <div className="loading w-2/3" />
          </div>
        ) : (
          <>
            {view !== "compartidas" && (
              <>
                <div className="section-title">
                  <h2>Mis líneas de tiempo</h2>
                  {view === "inicio" && owned.length > 0 && (
                    <button className="link" onClick={() => setView("mias")}>
                      Ver todas
                    </button>
                  )}
                </div>
                {ownedShown.length === 0 ? (
                  <div className="card empty">
                    <div className="ico">＋</div>
                    <strong>{q ? "Sin resultados" : "Aún no tienes líneas de tiempo"}</strong>
                    <p className="small muted">
                      {q ? "Prueba con otro nombre." : "Crea la primera y empieza a agregar tus hitos."}
                    </p>
                  </div>
                ) : (
                  <div className="card table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Última edición</th>
                          <th>Dueño</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(view === "inicio" ? ownedShown.slice(0, 5) : ownedShown).map((t) => (
                          <tr key={t.id} className="clickable" onClick={() => router.push(`/timelines/${t.id}`)}>
                            <td>
                              <Link href={`/timelines/${t.id}`} className="font-bold" onClick={(e) => e.stopPropagation()}>
                                {t.title}
                              </Link>
                              <br />
                              <span className="small muted">{milestoneCount(t._count.items)}</span>
                            </td>
                            <td>{formatEdited(t.updatedAt)}</td>
                            <td>
                              <span className="avatar">{initials(me)}</span>Tú
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {view !== "mias" && (
              <>
                <div className="section-title">
                  <h2>Compartidas conmigo</h2>
                  {view === "inicio" && shared.length > 0 && (
                    <button className="link" onClick={() => setView("compartidas")}>
                      Ver todas
                    </button>
                  )}
                </div>
                {sharedShown.length === 0 ? (
                  <div className="card empty">
                    <div className="ico">↗</div>
                    <strong>{q ? "Sin resultados" : "Nada compartido todavía"}</strong>
                    <p className="small muted">
                      {q ? "Prueba con otro nombre." : "Cuando alguien comparta una línea de tiempo contigo, aparecerá aquí."}
                    </p>
                  </div>
                ) : (
                  <div className="card table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Última edición</th>
                          <th>Dueño</th>
                          <th>Permiso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(view === "inicio" ? sharedShown.slice(0, 5) : sharedShown).map((t) => {
                          const owner = t.owner.name || t.owner.email;
                          const canEdit = t.shares[0]?.permission === "EDIT";
                          return (
                            <tr key={t.id} className="clickable" onClick={() => router.push(`/timelines/${t.id}`)}>
                              <td>
                                <Link href={`/timelines/${t.id}`} className="font-bold" onClick={(e) => e.stopPropagation()}>
                                {t.title}
                              </Link>
                                <br />
                                <span className="small muted">{milestoneCount(t._count.items)}</span>
                              </td>
                              <td>{formatEdited(t.updatedAt)}</td>
                              <td>
                                <span className="avatar">{initials(owner)}</span>
                                {owner}
                              </td>
                              <td>
                                <span className={`badge ${canEdit ? "badge-edit" : "badge-view"}`}>
                                  {canEdit ? "Puede editar" : "Puede ver"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
