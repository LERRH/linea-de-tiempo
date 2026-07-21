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
    <div className="rounded border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-700">Grupos (leyenda por colores)</h3>

      {groups.length === 0 && (
        <p className="mb-3 text-sm text-slate-500">
          Aún no has creado grupos. Crea uno para poder asignarle un color a cada hito y mostrar una leyenda.
        </p>
      )}

      <div className="mb-3 flex flex-col gap-2">
        {groups.map((group) => (
          <div key={group.id} className="flex items-center gap-2">
            <input
              type="color"
              value={group.color}
              disabled={!editable}
              onChange={(e) => updateGroup(group.id, { color: e.target.value })}
              className="h-8 w-12 rounded border border-slate-200"
            />
            <input
              type="text"
              value={group.name}
              disabled={!editable}
              onChange={(e) => updateGroup(group.id, { name: e.target.value })}
              className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm disabled:bg-slate-50"
            />
            {editable && (
              <button onClick={() => removeGroup(group.id)} className="text-sm text-slate-400 hover:text-red-600">
                Quitar
              </button>
            )}
          </div>
        ))}
      </div>

      {editable && (
        <button
          onClick={addGroup}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          + Agregar grupo
        </button>
      )}
    </div>
  );
}
