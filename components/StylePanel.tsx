"use client";

import { FONT_OPTIONS, TimelineStyle } from "@/lib/palette";

interface Props {
  style: TimelineStyle;
  onChange: (style: TimelineStyle) => void;
  editable: boolean;
}

export default function StylePanel({ style, onChange, editable }: Props) {
  if (!editable) return null;

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-brand-ink">Estilo</h3>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Fuente
          <select
            value={style.fontFamily}
            onChange={(e) => onChange({ ...style, fontFamily: e.target.value })}
            className="rounded border border-slate-200 px-2 py-1 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Tamaño de letra
          <input
            type="number"
            min={10}
            max={24}
            value={style.fontSizePx}
            onChange={(e) => onChange({ ...style, fontSizePx: Number(e.target.value) })}
            className="w-20 rounded border border-slate-200 px-2 py-1 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Distribución
          <select
            value={style.rows}
            onChange={(e) => onChange({ ...style, rows: Number(e.target.value) === 2 ? 2 : 1 })}
            className="rounded border border-slate-200 px-2 py-1 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
          >
            <option value={1}>Una línea</option>
            <option value={2}>Dos líneas (para muchos hitos)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Color por defecto (sin grupo)
          <input
            type="color"
            value={style.defaultColor}
            onChange={(e) => onChange({ ...style, defaultColor: e.target.value })}
            className="h-9 w-16 rounded border border-slate-200"
          />
        </label>

        <label className="flex items-center gap-2 self-end pb-1.5 text-sm">
          <input
            type="checkbox"
            checked={style.showTodayMarker}
            onChange={(e) => onChange({ ...style, showTodayMarker: e.target.checked })}
            className="accent-brand-accent"
          />
          Marca de fecha actual
        </label>

        {style.showTodayMarker && (
          <label className="flex flex-col gap-1 text-sm">
            Color de la marca
            <input
              type="color"
              value={style.todayMarkerColor}
              onChange={(e) => onChange({ ...style, todayMarkerColor: e.target.value })}
              className="h-9 w-16 rounded border border-slate-200"
            />
          </label>
        )}

        <label className="flex items-center gap-2 self-end pb-1.5 text-sm">
          <input
            type="checkbox"
            checked={style.showDaysBetween}
            onChange={(e) => onChange({ ...style, showDaysBetween: e.target.checked })}
            className="accent-brand-accent"
          />
          Días entre hitos
        </label>
      </div>
    </div>
  );
}
