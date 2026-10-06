"use client";

import { useRef, useState } from "react";
import { ChartItem } from "@/components/TimelineChart";
import { TimelineGroup } from "@/lib/palette";
import { downloadExcel, parseExcelFile, resolveImportedRows } from "@/lib/excel";

interface Props {
  items: ChartItem[];
  onChange: (items: ChartItem[]) => void;
  editable: boolean;
  groups: TimelineGroup[];
  onGroupsChange: (groups: TimelineGroup[]) => void;
  fileName: string;
}

// Date math in UTC so daylight-saving shifts never turn N days into N±1.
function utcMs(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function daysBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  return Math.round((utcMs(to) - utcMs(from)) / 86400000);
}

function addDays(isoDate: string, days: number): string {
  return new Date(utcMs(isoDate) + days * 86400000).toISOString().slice(0, 10);
}

/**
 * Days since the previous milestone. Keeps its own draft so the field can be
 * cleared while typing; only whole, non-negative numbers are committed.
 */
function DaysInput({
  days,
  disabled,
  label,
  onCommit,
}: {
  days: number | null;
  disabled: boolean;
  label: string;
  onCommit: (days: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      type="number"
      min={0}
      step={1}
      className={`cell-input days-input ${days !== null && days < 0 ? "text-red-600" : ""}`}
      aria-label={label}
      title="Días desde el hito anterior"
      disabled={disabled}
      value={draft ?? (days ?? "")}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== "" && Number.isInteger(n) && n >= 0) onCommit(n);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

export default function TimelineTable({
  items,
  onChange,
  editable,
  groups,
  onGroupsChange,
  fileName,
}: Props) {
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update(index: number, patch: Partial<ChartItem>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  }

  /**
   * Moves milestone `index` to `newDate` and shifts every later milestone by
   * the same amount, so the days between milestones stay the same.
   */
  function setDate(index: number, newDate: string) {
    const oldDate = items[index].date;
    const delta = oldDate && newDate ? daysBetween(oldDate, newDate) : null;
    onChange(
      items.map((item, i) => {
        if (i === index) return { ...item, date: newDate };
        if (i > index && delta && item.date) return { ...item, date: addDays(item.date, delta) };
        return item;
      })
    );
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

  const colorOf = (grupoId: string) => groups.find((g) => g.id === grupoId)?.color;

  return (
    <div>
      <div className="table-tools">
        {editable && (
          <button className="btn btn-coral btn-sm" onClick={addRow}>
            ＋ Agregar hito
          </button>
        )}
        {editable && (
          <>
            <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
              ⇧ Importar Excel
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
        <button className="btn btn-outline btn-sm" onClick={exportExcel}>
          ⇩ Exportar Excel
        </button>
      </div>
      {importError && <p className="error mb-3">{importError}</p>}

      <section className="card table-wrap">
        <table className="data-table compact">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th title="Días desde el hito anterior">Días</th>
              <th>Encabezado</th>
              <th>Hito / Descripción</th>
              <th>Grupo</th>
              {editable && <th aria-label="Acciones" />}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={editable ? 7 : 6} className="empty">
                  <span className="muted">
                    {editable ? "Agrega tu primer hito con “＋ Agregar hito” o importa un Excel." : "Sin hitos todavía."}
                  </span>
                </td>
              </tr>
            )}
            {items.map((item, i) => {
              const days = i === 0 ? null : daysBetween(items[i - 1].date, item.date);
              return (
                <tr key={i}>
                  <td className="muted">{i + 1}</td>
                  <td>
                    <input
                      type="date"
                      className="cell-input"
                      aria-label={`Fecha del hito ${i + 1}`}
                      value={item.date}
                      disabled={!editable}
                      onChange={(e) => setDate(i, e.target.value)}
                    />
                  </td>
                  <td>
                    {i === 0 ? (
                      <span className="muted px-2">—</span>
                    ) : (
                      <DaysInput
                        days={days}
                        disabled={!editable || !items[i - 1].date}
                        label={`Días desde el hito ${i} al hito ${i + 1}`}
                        onCommit={(n) => setDate(i, addDays(items[i - 1].date, n))}
                      />
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="cell-input font-semibold"
                      aria-label={`Encabezado del hito ${i + 1}`}
                      value={item.encabezado}
                      disabled={!editable}
                      placeholder="Encabezado"
                      onChange={(e) => update(i, { encabezado: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="cell-input min-w-[200px]"
                      aria-label={`Descripción del hito ${i + 1}`}
                      value={item.hito}
                      disabled={!editable}
                      placeholder="Descripción del hito"
                      onChange={(e) => update(i, { hito: e.target.value })}
                    />
                  </td>
                  <td>
                    <span className="flex items-center">
                      <i className="dot" style={{ background: colorOf(item.grupoId) ?? "#cbd5e1" }} />
                      <select
                        className="cell-input"
                        aria-label={`Grupo del hito ${i + 1}`}
                        value={item.grupoId}
                        disabled={!editable}
                        onChange={(e) => update(i, { grupoId: e.target.value })}
                      >
                        <option value="">Sin grupo</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </td>
                  {editable && (
                    <td>
                      <button
                        className="icon-btn"
                        onClick={() => moveRow(i, -1)}
                        disabled={i === 0}
                        title="Subir hito"
                        aria-label="Subir hito"
                      >
                        ↑
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => moveRow(i, 1)}
                        disabled={i === items.length - 1}
                        title="Bajar hito"
                        aria-label="Bajar hito"
                      >
                        ↓
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => insertRowAfter(i)}
                        title="Insertar hito debajo"
                        aria-label="Insertar hito debajo"
                      >
                        ＋
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => removeRow(i)}
                        title="Eliminar hito"
                        aria-label="Eliminar hito"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
