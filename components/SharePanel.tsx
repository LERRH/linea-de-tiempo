"use client";

import { useState } from "react";

export interface ShareEntry {
  id: string;
  permission: "VIEW" | "EDIT";
  sharedWithUser: { email: string; name: string | null };
}

interface Props {
  timelineId: string;
  shares: ShareEntry[];
  onChange: (shares: ShareEntry[]) => void;
}

export default function SharePanel({ timelineId, shares, onChange }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [permission, setPermission] = useState<"VIEW" | "EDIT">("VIEW");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/timelines/${timelineId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, permission }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo compartir.");
      return;
    }
    const others = shares.filter((s) => s.sharedWithUser.email !== data.sharedWithUser.email);
    onChange([...others, data]);
    setIdentifier("");
  }

  async function removeShare(shareId: string) {
    await fetch(`/api/timelines/${timelineId}/share?shareId=${shareId}`, { method: "DELETE" });
    onChange(shares.filter((s) => s.id !== shareId));
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-brand-ink">Compartir</h3>
      <form onSubmit={addShare} className="mb-3 flex flex-wrap gap-2">
        <input
          type="text"
          required
          placeholder="Email o nombre de usuario"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
        />
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
          className="rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
        >
          <option value="VIEW">Puede ver</option>
          <option value="EDIT">Puede editar</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-primaryDark disabled:opacity-50"
        >
          Invitar
        </button>
      </form>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {shares.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {shares.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span>
                {s.sharedWithUser.name || s.sharedWithUser.email}{" "}
                <span className="text-slate-400">
                  · {s.permission === "EDIT" ? "puede editar" : "solo ver"}
                </span>
              </span>
              <button onClick={() => removeShare(s.id)} className="text-slate-400 hover:text-red-600">
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
