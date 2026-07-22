"use client";

import { useRef, useState } from "react";
import { ChartItem } from "@/components/TimelineChart";
import { ColumnsConfig, TimelineGroup } from "@/lib/palette";
import { downloadExcel, parseExcelFile, resolveImportedRows } from "@/lib/excel";

interface Props {
  items: ChartItem[];
  onChange: (items: ChartItem[]) => void;
  editable: boolean;
  columns: ColumnsConfig;
  onColumnsChange: (columns: ColumnsConfig) => void;
  groups: TimelineGroup[];
  onGroupsChange: (groups: TimelineGroup[]) => void;
  fileName: string;
}

const COLUMN_LABELS: { key: keyof ColumnsConfig; label: string }[] = [
  { key: "fecha", label: "Fecha" },
  { key: "encabezado", label: "Encabezado" },
  { key: "hito", label: "Hito" },
];

export default function TimelineTable({
  items,
  onChange,
  editable,
  columns,
  onColumnsChange,
  groups,
  onGroupsChange,
  fileName,
}: Props) {
  const activeCount = Object.values(columns).filter(Boolean).length;
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleColumn(key: keyof ColumnsConfig) {
    if (columns[key] && activeCount <= 1) return;
    onColumnsChange({ ...columns, [key]: !columns[key] });
  }

  function update(index: number, patch: Partial<ChartItem>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  }

  function addRow() {
    onChange([
      ...items,
      { date: new Date().toISOString().slice(0, 10), encabezado: "", hito: "", grupoId: "" },
    ]);
  }

  function insertRowAfter(index: number) {
    const next = [...items];
    next.splice(index + 1, 0, { date: items[index].date, encabezado: "", hito: "", grupoId: "" });
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function exportExcel() {
    downloadExcel(items, groups, fileName || "linea-de-tiempo");
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImportError(null);
    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        setImportError("No se encontraron filas con datos en el archivo.");
        return;
      }
      if (!confirm(`Se encontraron ${rows.length} fila(s). Esto reemplazará todos los datos actuales. ¿Continuar?`)) {
        return;
      }
      const { items: newItems, groups: newGroups } = resolveImportedRows(rows, groups);
      onChange(newItems);
      if (newGroups.length !== groups.length) onGroupsChange(newGroups);
    } catch {
      setImportError("No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) válido.");
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={exportExcel}
          className="rounded border border-brand-primary px-3 py-1.5 text-sm text-brand-primary hover:bg-brand-primary/5"
        >
          Exportar a Excel
        </button>
        {editable && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-brand-accent px-3 py-1.5 text-sm text-brand-accent hover:bg-brand-accent/10"
            >
              Importar desde Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelected}
              className="hidden"
            />
          </>
        )}
      </div>
      {importError && <p className="mb-3 text-sm text-red-600">{importError}</p>}

      {editable && (
        <div className="mb-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span>Columnas:</span>
          {COLUMN_LABELS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={columns[key]}
                onChange={() => toggleColumn(key)}
                disabled={columns[key] && activeCount <= 1}
                className="accent-brand-accent"
              />
              {label}
            </label>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-brand-cream/40 text-left">
              {columns.fecha && <th className="px-3 py-2 font-medium text-slate-600">Fecha</th>}
              {columns.encabezado && <th className="px-3 py-2 font-medium text-slate-600">Encabezado</th>}
              {columns.hito && <th className="px-3 py-2 font-medium text-slate-600">Hito</th>}
              <th className="px-3 py-2 font-medium text-slate-600">Grupo</th>
              {editable && <th className="px-3 py-2 font-medium text-slate-600">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                {columns.fecha && (
                  <td className="px-3 py-1.5">
                    <input
                      type="date"
                      value={item.date}
                      disabled={!editable}
                      onChange={(e) => update(i, { date: e.target.value })}
                      className="w-full rounded border border-slate-200 px-2 py-1 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent disabled:bg-slate-50"
                    />
                  </td>
                )}
                {columns.encabezado && (
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={item.encabezado}
                      disabled={!editable}
                      placeholder="Encabezado (negrita)"
                      onChange={(e) => update(i, { encabezado: e.target.value })}
                      className="w-full rounded border border-slate-200 px-2 py-1 font-semibold outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent disabled:bg-slate-50"
                    />
                  </td>
                )}
                {columns.hito && (
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={item.hito}
                      disabled={!editable}
                      placeholder="Nombre del hito"
                      onChange={(e) => update(i, { hito: e.target.value })}
                      className="w-full rounded border border-slate-200 px-2 py-1 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent disabled:bg-slate-50"
                    />
                  </td>
                )}
                <td className="px-3 py-1.5">
                  <select
                    value={item.grupoId}
                    disabled={!editable}
                    onChange={(e) => update(i, { grupoId: e.target.value })}
                    className="w-full rounded border border-slate-200 px-2 py-1 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent disabled:bg-slate-50"
                  >
                    <option value="">Sin grupo</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </td>
                {editable && (
                  <td className="whitespace-nowrap px-3 py-1.5 text-center">
                    <button
                      onClick={() => moveRow(i, -1)}
                      disabled={i === 0}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-25"
                      title="Subir hito"
                    >
                      ↑
                    </button>{" "}
                    <button
                      onClick={() => moveRow(i, 1)}
                      disabled={i === items.length - 1}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-25"
                      title="Bajar hito"
                    >
                      ↓
                    </button>{" "}
                    <button
                      onClick={() => insertRowAfter(i)}
                      className="text-slate-400 hover:text-brand-accent"
                      title="Insertar hito debajo"
                    >
                      +
                    </button>{" "}
                    <button
                      onClick={() => removeRow(i)}
                      className="text-slate-400 hover:text-red-600"
                      title="Eliminar fila"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {editable && (
          <button onClick={addRow} className="w-full border-t border-slate-200 py-2 text-sm text-brand-accent hover:bg-slate-50">
            + Agregar fila
          </button>
        )}
      </div>
    </div>
  );
}
