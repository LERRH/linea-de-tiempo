import * as XLSX from "xlsx";
import type { ChartItem } from "@/components/TimelineChart";
import { colorForIndex, type TimelineGroup } from "@/lib/palette";

const HEADERS = ["Fecha", "Encabezado", "Hito", "Grupo"] as const;

function toLocalDate(date: string): Date {
  return new Date(date + "T00:00:00");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function downloadExcel(items: ChartItem[], groups: TimelineGroup[], fileName: string) {
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "";

  const rows = items.map((item) => ({
    Fecha: item.date ? toLocalDate(item.date) : "",
    Encabezado: item.encabezado,
    Hito: item.hito,
    Grupo: groupName(item.grupoId),
  }));

  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...HEADERS] });
  sheet["!cols"] = [{ wch: 12 }, { wch: 32 }, { wch: 32 }, { wch: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Datos");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function excelSerialToYMD(serial: number): { y: number; m: number; d: number } {
  // Excel's day 0 is 1899-12-30 (accounts for the 1900 leap-year bug). Anchored
  // entirely in UTC arithmetic (construct from UTC ms, read back with UTC
  // getters) so no local timezone ever enters this calculation.
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(utcMs);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

function normalizeDate(value: unknown): string {
  const today = new Date();
  const fallback = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  if (value instanceof Date && !isNaN(value.getTime())) {
    // SheetJS anchors date cells to the JS Date's local wall-clock getters for
    // both encoding (see downloadExcel/toLocalDate) and decoding, so we must
    // read it back the same way — using UTC getters here would shift the date
    // by one day for anyone in a positive UTC-offset timezone.
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  if (typeof value === "number" && isFinite(value)) {
    const { y, m, d } = excelSerialToYMD(value);
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return `${iso[1]}-${pad2(Number(iso[2]))}-${pad2(Number(iso[3]))}`;

    const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]);
      let year = Number(dmy[3]);
      if (year < 100) year += year < 70 ? 2000 : 1900;
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
    }
  }

  return fallback;
}

export interface ImportedRow {
  date: string;
  encabezado: string;
  hito: string;
  grupoName: string;
}

export async function parseExcelFile(file: File): Promise<ImportedRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return rows
    .map((row) => {
      const entries = Object.entries(row).map(([k, v]) => [normalizeHeader(k), v] as const);
      const get = (key: string) => entries.find(([k]) => k === key)?.[1] ?? "";

      const encabezado = String(get("encabezado") ?? "").trim();
      const hito = String(get("hito") ?? "").trim();
      const grupoName = String(get("grupo") ?? "").trim();
      const dateValue = get("fecha");

      return {
        date: normalizeDate(dateValue),
        encabezado,
        hito,
        grupoName,
      };
    })
    .filter((row) => row.encabezado || row.hito || row.grupoName);
}

export function resolveImportedRows(
  rows: ImportedRow[],
  existingGroups: TimelineGroup[]
): { items: ChartItem[]; groups: TimelineGroup[] } {
  const groups = [...existingGroups];

  function groupIdFor(name: string): string {
    if (!name) return "";
    const match = groups.find((g) => g.name.toLowerCase() === name.toLowerCase());
    if (match) return match.id;
    const id = `grp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    groups.push({ id, name, color: colorForIndex(groups.length) });
    return id;
  }

  const items: ChartItem[] = rows.map((row) => ({
    date: row.date,
    encabezado: row.encabezado,
    hito: row.hito,
    grupoId: groupIdFor(row.grupoName),
  }));

  return { items, groups };
}
