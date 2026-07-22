"use client";

import { FONT_OPTIONS, TimelineStyle } from "@/lib/palette";

interface Props {
  style: TimelineStyle;
  onChange: (style: TimelineStyle) => void;
  editable: boolean;
}

const LABEL = "mb-1 block text-xs font-medium text-slate-500";
const CONTROL =
  "w-full rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent";
const SECTION_TITLE = "mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400";

export default function StylePanel({ style, onChange, editable }: Props) {
  if (!editable) return null;

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium text-brand-ink">Estilo</h3>

      <div>
        <p className={SECTION_TITLE}>Texto y diseño</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label>
            <span className={LABEL}>Fuente</span>
            <select
              value={style.fontFamily}
              onChange={(e) => onChange({ ...style, fontFamily: e.target.value })}
              className={CONTROL}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={LABEL}>Tamaño de letra</span>
            <input
              type="number"
              min={10}
              max={24}
              value={style.fontSizePx}
              onChange={(e) => onChange({ ...style, fontSizePx: Number(e.target.value) })}
              className={CONTROL}
            />
          </label>

          <label>
            <span className={LABEL}>Distribución</span>
            <select
              value={style.rows}
              onChange={(e) => onChange({ ...style, rows: Number(e.target.value) === 2 ? 2 : 1 })}
              className={CONTROL}
            >
              <option value={1}>Una línea</option>
              <option value={2}>Dos líneas</option>
            </select>
          </label>

          <label>
            <span className={LABEL}>Color por defecto</span>
            <input
              type="color"
              value={style.defaultColor}
              onChange={(e) => onChange({ ...style, defaultColor: e.target.value })}
              className="h-9 w-full rounded border border-slate-200"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className={SECTION_TITLE}>Marcadores opcionales</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-brand-ink">
              <input
                type="checkbox"
                checked={style.showTodayMarker}
                onChange={(e) => onChange({ ...style, showTodayMarker: e.target.checked })}
                className="accent-brand-accent"
              />
              Marca de fecha actual
            </label>
            {style.showTodayMarker && (
              <input
                type="color"
                value={style.todayMarkerColor}
                onChange={(e) => onChange({ ...style, todayMarkerColor: e.target.value })}
                className="h-7 w-12 rounded border border-slate-200"
                title="Color de la marca"
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-ink">
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
    </div>
  );
}
