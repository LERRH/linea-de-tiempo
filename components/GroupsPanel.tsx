"use client";

import { TimelineGroup, colorForIndex } from "@/lib/palette";

interface Props {
  groups: TimelineGroup[];
  onChange: (groups: TimelineGroup[]) => void;
  editable: boolean;
}

function newGroupId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `grp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function GroupsPanel({ groups, onChange, editable }: Props) {
  function addGroup() {
    onChange([
      ...groups,
      { id: newGroupId(), name: `Grupo ${groups.length + 1}`, color: colorForIndex(groups.length) },
    ]);
  }

  function updateGroup(id: string, patch: Partial<TimelineGroup>) {
    onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function removeGroup(id: string) {
    onChange(groups.filter((g) => g.id !== id));
  }

  return (
    <div className="panel-section">
      <h3>Grupos (leyenda por colores)</h3>

      {groups.length === 0 && (
        <p className="small muted mb-3">
          Aún no hay grupos. Crea uno para asignar un color a cada hito y mostrar una leyenda.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.id} className="group-row">
          <input
            className="input"
            type="color"
            value={group.color}
            disabled={!editable}
            aria-label={`Color de ${group.name}`}
            onChange={(e) => updateGroup(group.id, { color: e.target.value })}
          />
          <input
            className="input input-sm"
            type="text"
            value={group.name}
            disabled={!editable}
            aria-label="Nombre del grupo"
            onChange={(e) => updateGroup(group.id, { name: e.target.value })}
          />
          {editable && (
            <button
              className="icon-btn danger"
              onClick={() => removeGroup(group.id)}
              title="Quitar grupo"
              aria-label={`Quitar ${group.name}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {editable && (
        <button className="btn btn-outline btn-sm mt-2 w-full" onClick={addGroup}>
          ＋ Agregar grupo
        </button>
      )}
    </div>
  );
}
