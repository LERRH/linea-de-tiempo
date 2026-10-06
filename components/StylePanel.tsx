"use client";

import { ColumnsConfig, FONT_OPTIONS, TimelineStyle } from "@/lib/palette";

interface Props {
  style: TimelineStyle;
  onChange: (style: TimelineStyle) => void;
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="toggle"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

const COLUMN_TOGGLES: { key: keyof ColumnsConfig; label: string }[] = [
  { key: "fecha", label: "Mostrar fechas" },
  { key: "encabezado", label: "Mostrar encabezados" },
  { key: "hito", label: "Mostrar descripciones" },
];

export default function StylePanel({ style, onChange }: Props) {
  const activeColumns = Object.values(style.columns).filter(Boolean).length;

  return (
    <>
      <div className="panel-section">
        <h3>Vista general</h3>
        <div className="radio-row">
          <span>Disposición</span>
          <span>
            {([1, 2] as const).map((rows) => (
              <label key={rows}>
                <input
                  type="radio"
                  name="rows"
                  checked={style.rows === rows}
                  onChange={() => onChange({ ...style, rows })}
                />
                {rows === 1 ? "1 fila" : "2 filas"}
              </label>
            ))}
          </span>
        </div>

        <ToggleRow
          label="Mostrar marcador “Hoy”"
          checked={style.showTodayMarker}
          onChange={(showTodayMarker) => onChange({ ...style, showTodayMarker })}
        />
        {style.showTodayMarker && (
          <div className="sub-options">
            <select
              className="input input-sm"
              aria-label="Posición del marcador Hoy"
              value={style.todayMarkerPosition}
              onChange={(e) =>
                onChange({ ...style, todayMarkerPosition: e.target.value === "top" ? "top" : "bottom" })
              }
            >
              <option value="bottom">Abajo</option>
              <option value="top">Arriba</option>
            </select>
            <input
              className="input input-sm"
              type="color"
              aria-label="Color del marcador Hoy"
              title="Color del marcador"
              value={style.todayMarkerColor}
              onChange={(e) => onChange({ ...style, todayMarkerColor: e.target.value })}
            />
          </div>
        )}

        <ToggleRow
          label="Mostrar días entre hitos"
          checked={style.showDaysBetween}
          onChange={(showDaysBetween) => onChange({ ...style, showDaysBetween })}
        />

        {COLUMN_TOGGLES.map(({ key, label }) => (
          <ToggleRow
            key={key}
            label={label}
            checked={style.columns[key]}
            // Keep at least one text line per milestone.
            disabled={style.columns[key] && activeColumns <= 1}
            onChange={(checked) => onChange({ ...style, columns: { ...style.columns, [key]: checked } })}
          />
        ))}
      </div>

      <div className="panel-section">
        <h3>Estilo</h3>
        <div className="field">
          <label htmlFor="style-font">Fuente</label>
          <select
            id="style-font"
            className="input"
            value={style.fontFamily}
            onChange={(e) => onChange({ ...style, fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="style-size">Tamaño del texto (px)</label>
          <input
            id="style-size"
            className="input"
            type="number"
            min={10}
            max={24}
            value={style.fontSizePx}
            onChange={(e) => onChange({ ...style, fontSizePx: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="panel-section">
        <h3>Colores</h3>
        <div className="field">
          <label htmlFor="style-color">Color de hitos sin grupo</label>
          <input
            id="style-color"
            className="input"
            type="color"
            value={style.defaultColor}
            onChange={(e) => onChange({ ...style, defaultColor: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}
