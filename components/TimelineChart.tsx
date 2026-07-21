"use client";

import { forwardRef, useMemo } from "react";
import { formatDate } from "@/lib/format";
import { TimelineStyle } from "@/lib/palette";

export interface ChartItem {
  date: string; // ISO yyyy-mm-dd
  encabezado: string;
  hito: string;
  grupoId: string;
}

interface Props {
  items: ChartItem[];
  style: TimelineStyle;
}

const IDEAL_SPACING = 200;
const MIN_SPACING = 60;
const MAX_WIDTH = 1000;
const MARGIN_X = 90;
const ROW_HEIGHT = 300;
const ROW_LINE_Y = 150;
const ROW_GAP = 40;
const TICK_LEN = 30;
const DOT_R = 7;
const LEGEND_ROW_HEIGHT = 26;
const LEGEND_SWATCH = 14;
const LEGEND_FONT_SIZE = 12;

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function layoutLegendRows(groups: TimelineStyle["groups"], availableWidth: number) {
  const rows: (typeof groups)[] = [];
  let currentRow: typeof groups = [];
  let currentWidth = 0;

  for (const group of groups) {
    const itemWidth = LEGEND_SWATCH + 6 + group.name.length * (LEGEND_FONT_SIZE * 0.62) + 24;
    if (currentRow.length > 0 && currentWidth + itemWidth > availableWidth) {
      rows.push(currentRow);
      currentRow = [];
      currentWidth = 0;
    }
    currentRow.push(group);
    currentWidth += itemWidth;
  }
  if (currentRow.length > 0) rows.push(currentRow);
  return rows;
}

const TimelineChart = forwardRef<SVGSVGElement, Props>(function TimelineChart({ items, style }, ref) {
  const { sorted, colorOf } = useMemo(() => {
    const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));
    const colorOf = (grupoId: string) => {
      const group = style.groups.find((g) => g.id === grupoId);
      return group?.color ?? style.defaultColor;
    };
    return { sorted: sortedItems, colorOf };
  }, [items, style]);

  const n = sorted.length;

  if (n === 0) {
    return (
      <svg ref={ref} width={700} height={ROW_HEIGHT} viewBox={`0 0 700 ${ROW_HEIGHT}`}>
        <text x={350} y={ROW_LINE_Y} textAnchor="middle" fill="#94a3b8" fontSize={14}>
          Agrega filas en la tabla para ver la línea de tiempo
        </text>
      </svg>
    );
  }

  const useTwoRows = style.rows === 2 && n > 1;
  const rowSplit = useTwoRows ? Math.ceil(n / 2) : n;
  const row1 = sorted.slice(0, rowSplit);
  const row2 = useTwoRows ? sorted.slice(rowSplit) : [];
  const perRowCount = Math.max(row1.length, row2.length);

  const availableWidth = MAX_WIDTH - MARGIN_X * 2;
  const spacing =
    perRowCount > 1 ? Math.max(MIN_SPACING, Math.min(IDEAL_SPACING, availableWidth / (perRowCount - 1))) : IDEAL_SPACING;
  const contentWidth = (perRowCount - 1) * spacing;
  const width = Math.max(700, MARGIN_X * 2 + contentWidth);
  const maxCharsPerLine = Math.round(Math.max(10, Math.min(22, spacing / 8)));

  const legendRows = layoutLegendRows(style.groups, width - MARGIN_X * 2);
  const legendHeight = legendRows.length > 0 ? legendRows.length * LEGEND_ROW_HEIGHT + 16 : 0;

  const chartHeight = useTwoRows ? ROW_HEIGHT * 2 + ROW_GAP : ROW_HEIGHT;
  const height = chartHeight + legendHeight;

  const xFor = (index: number, rowCount: number) => (rowCount === 1 ? width / 2 : MARGIN_X + index * spacing);

  function renderRow(rowItems: ChartItem[], lineY: number, globalOffset: number) {
    const rowCount = rowItems.length;
    return (
      <g key={`row-${globalOffset}`}>
        {rowItems.slice(0, -1).map((_, i) => {
          const nextColor = colorOf(rowItems[i + 1].grupoId);
          return (
            <line
              key={`seg-${globalOffset}-${i}`}
              x1={xFor(i, rowCount)}
              y1={lineY}
              x2={xFor(i + 1, rowCount)}
              y2={lineY}
              stroke={nextColor}
              strokeWidth={4}
            />
          );
        })}

        {style.showDaysBetween &&
          rowItems.slice(0, -1).map((item, i) => {
            const x1 = xFor(i, rowCount);
            const x2 = xFor(i + 1, rowCount);
            const d1 = new Date(item.date + "T00:00:00").getTime();
            const d2 = new Date(rowItems[i + 1].date + "T00:00:00").getTime();
            const days = Math.round((d2 - d1) / 86400000);
            return (
              <text
                key={`days-${globalOffset}-${i}`}
                x={(x1 + x2) / 2}
                y={lineY - 9}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
              >
                {days} {days === 1 ? "día" : "días"}
              </text>
            );
          })}

        {rowItems.map((item, i) => {
          const x = xFor(i, rowCount);
          const color = colorOf(item.grupoId);
          const isTop = (globalOffset + i) % 2 === 0;
          const lineHeight = style.fontSizePx + 6;

          const lineDescs: { text: string; bold: boolean; color: string }[] = [];
          if (style.columns.fecha) {
            lineDescs.push({ text: formatDate(new Date(item.date + "T00:00:00")), bold: true, color });
          }
          if (style.columns.encabezado && item.encabezado.trim()) {
            for (const line of wrapText(item.encabezado, maxCharsPerLine)) {
              lineDescs.push({ text: line, bold: true, color: "#1e293b" });
            }
          }
          if (style.columns.hito && item.hito.trim()) {
            for (const line of wrapText(item.hito, maxCharsPerLine)) {
              lineDescs.push({ text: line, bold: false, color: "#334155" });
            }
          }

          const tickY2 = isTop ? lineY - TICK_LEN : lineY + TICK_LEN;
          const totalTextHeight = lineDescs.length * lineHeight;

          const firstLineY = isTop
            ? tickY2 - 10 - (totalTextHeight - lineHeight)
            : tickY2 + 10 + lineHeight;

          return (
            <g key={`item-${globalOffset}-${i}`}>
              <line x1={x} y1={lineY} x2={x} y2={tickY2} stroke="#94a3b8" strokeWidth={1.5} />
              <circle cx={x} cy={lineY} r={DOT_R} fill={color} stroke="#ffffff" strokeWidth={2} />
              {lineDescs.length > 0 && (
                <text x={x} y={firstLineY} textAnchor="middle">
                  {lineDescs.map((ld, li) => (
                    <tspan
                      key={li}
                      x={x}
                      dy={li === 0 ? 0 : lineHeight}
                      fontWeight={ld.bold ? 700 : 400}
                      fontSize={style.fontSizePx}
                      fill={ld.color}
                    >
                      {ld.text}
                    </tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  const row1LineY = ROW_LINE_Y;
  const row2LineY = ROW_HEIGHT + ROW_GAP + ROW_LINE_Y;

  function globalFractionalIndex(dateStr: string): number {
    if (n === 1) return 0;
    if (dateStr <= sorted[0].date) return 0;
    if (dateStr >= sorted[n - 1].date) return n - 1;
    for (let i = 0; i < n - 1; i++) {
      if (dateStr >= sorted[i].date && dateStr <= sorted[i + 1].date) {
        const d0 = new Date(sorted[i].date).getTime();
        const d1 = new Date(sorted[i + 1].date).getTime();
        const dt = new Date(dateStr).getTime();
        if (d1 === d0) return i;
        return i + (dt - d0) / (d1 - d0);
      }
    }
    return n - 1;
  }

  let todayMarker: { x: number; lineY: number } | null = null;
  if (style.showTodayMarker) {
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const gi = globalFractionalIndex(todayISO);
    if (useTwoRows && gi > rowSplit - 1) {
      todayMarker = { x: xFor(gi - rowSplit, row2.length), lineY: row2LineY };
    } else {
      todayMarker = { x: xFor(gi, row1.length), lineY: row1LineY };
    }
  }

  const legendTop = chartHeight + 12;

  return (
    <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} fontFamily={style.fontFamily}>
      {renderRow(row1, row1LineY, 0)}
      {useTwoRows && row2.length > 0 && (
        <path
          d={`M ${xFor(row1.length - 1, row1.length)} ${row1LineY} L ${width - MARGIN_X / 2} ${row1LineY} L ${
            width - MARGIN_X / 2
          } ${(row1LineY + row2LineY) / 2} L ${MARGIN_X} ${(row1LineY + row2LineY) / 2} L ${MARGIN_X} ${row2LineY}`}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
      )}
      {useTwoRows && renderRow(row2, row2LineY, row1.length)}
      {todayMarker && (
        <g>
          <line
            x1={todayMarker.x}
            y1={todayMarker.lineY}
            x2={todayMarker.x}
            y2={todayMarker.lineY + (ROW_HEIGHT - ROW_LINE_Y) - 14}
            stroke={style.todayMarkerColor}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          <text
            x={todayMarker.x}
            y={todayMarker.lineY + (ROW_HEIGHT - ROW_LINE_Y) - 2}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill={style.todayMarkerColor}
          >
            Hoy
          </text>
        </g>
      )}
      {legendRows.map((row, rowIndex) => {
        const rowWidth = row.reduce(
          (sum, g) => sum + LEGEND_SWATCH + 6 + g.name.length * (LEGEND_FONT_SIZE * 0.62) + 24,
          0
        );
        let cursorX = (width - rowWidth) / 2;
        const y = legendTop + rowIndex * LEGEND_ROW_HEIGHT + LEGEND_SWATCH;
        return (
          <g key={`legend-row-${rowIndex}`}>
            {row.map((group) => {
              const itemWidth = LEGEND_SWATCH + 6 + group.name.length * (LEGEND_FONT_SIZE * 0.62) + 24;
              const swatchX = cursorX;
              const textX = swatchX + LEGEND_SWATCH + 6;
              cursorX += itemWidth;
              return (
                <g key={group.id}>
                  <rect
                    x={swatchX}
                    y={y - LEGEND_SWATCH + 2}
                    width={LEGEND_SWATCH}
                    height={LEGEND_SWATCH}
                    rx={3}
                    fill={group.color}
                  />
                  <text x={textX} y={y} fontSize={LEGEND_FONT_SIZE} fill="#334155">
                    {group.name}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
});

export default TimelineChart;
