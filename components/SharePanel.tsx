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
    <div className="panel-section">
      <h3>Compartir</h3>
      <form onSubmit={addShare}>
        <div className="field">
          <label htmlFor="share-identifier">Invitar por email o nombre de usuario</label>
          <input
            id="share-identifier"
            className="input input-sm"
            type="text"
            required
            placeholder="nombre@empresa.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="input input-sm"
            aria-label="Permiso"
            value={permission}
            onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
          >
            <option value="VIEW">Puede ver</option>
            <option value="EDIT">Puede editar</option>
          </select>
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading ? "Invitando…" : "Invitar"}
          </button>
        </div>
      </form>
      {error && <p className="error mt-3">{error}</p>}

      <div className="mt-4">
        {shares.length === 0 ? (
          <p className="small muted">Aún no has compartido esta línea de tiempo.</p>
        ) : (
          shares.map((s) => (
            <div key={s.id} className="share-row">
              <span className="truncate">
                <span className="avatar">{(s.sharedWithUser.name || s.sharedWithUser.email).slice(0, 2)}</span>
                {s.sharedWithUser.name || s.sharedWithUser.email}
              </span>
              <span className="flex items-center gap-1">
                <span className={`badge ${s.permission === "EDIT" ? "badge-edit" : "badge-view"}`}>
                  {s.permission === "EDIT" ? "Edita" : "Ve"}
                </span>
                <button className="icon-btn danger" onClick={() => removeShare(s.id)} title="Quitar acceso">
                  ✕
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
