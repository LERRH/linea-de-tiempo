// RutaPRO's default categorical palette: the brand's three hues (deep teal,
// coral, teal) first — nudged just enough in OKLCH chroma/lightness to clear
// the colorblind-safe + contrast checks — extended to 8 slots for timelines
// with many groups. Validated with dataviz's validate_palette.js (adjacent
// pairs, light mode): lightness band, chroma floor, CVD separation (protan/
// deutan), normal-vision floor, all pass; contrast sits in the WARN/"relief"
// band for two slots, which is legal because every colored mark on the chart
// always ships with a visible text label (legend + date/hito labels).
export const DEFAULT_PALETTE = [
  "#0077A3", // azul profundo (marca, ajustado en croma desde #005B73)
  "#FF8A65", // coral (marca)
  "#00B5A6", // verde azulado (marca)
  "#C1447E", // baya
  "#7C5CBF", // violeta
  "#B45309", // ámbar
  "#059669", // esmeralda
  "#9A3324", // ladrillo
];

export function colorForIndex(index: number): string {
  return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}

export interface TimelineGroup {
  id: string;
  name: string;
  color: string;
}

export interface ColumnsConfig {
  fecha: boolean;
  encabezado: boolean;
  hito: boolean;
}

export interface TimelineStyle {
  fontFamily: string;
  fontSizePx: number;
  defaultColor: string;
  rows: 1 | 2;
  showTodayMarker: boolean;
  todayMarkerColor: string;
  showDaysBetween: boolean;
  columns: ColumnsConfig;
  groups: TimelineGroup[];
}

export const DEFAULT_STYLE: TimelineStyle = {
  fontFamily: "Inter, Arial, sans-serif",
  fontSizePx: 13,
  defaultColor: DEFAULT_PALETTE[0],
  rows: 1,
  showTodayMarker: false,
  todayMarkerColor: "#FF8A65",
  showDaysBetween: false,
  columns: { fecha: true, encabezado: true, hito: true },
  groups: [],
};

export const FONT_OPTIONS = [
  { label: "Inter (moderna)", value: "Inter, Arial, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Courier (monoespaciada)", value: "'Courier New', Courier, monospace" },
];
