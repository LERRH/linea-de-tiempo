export const DEFAULT_PALETTE = [
  "#2563eb", // azul
  "#0d9488", // verde azulado
  "#b45309", // ámbar
  "#dc2626", // rojo
  "#7c3aed", // violeta
  "#059669", // esmeralda
  "#c2410c", // naranja
  "#0891b2", // cian
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
  todayMarkerColor: "#dc2626",
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
