import type { ChartItem } from "@/components/TimelineChart";
import { formatDate } from "@/lib/format";
import type { TimelineGroup } from "@/lib/palette";

// Fonts that ship with Office on Windows/macOS. The chart's font stack may
// start with a web font (e.g. Inter) that PowerPoint/Word won't have, so we
// pick the first family Office can actually render.
const OFFICE_FONTS = ["arial", "helvetica", "georgia", "times new roman", "courier new", "calibri", "verdana"];

function officeFont(fontFamily: string | null): string {
  const families = (fontFamily ?? "")
    .split(",")
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
  const known = families.find((f) => OFFICE_FONTS.includes(f.toLowerCase()));
  if (!known) return families[0] ?? "Arial";
  return known.toLowerCase() === "helvetica" ? "Arial" : known;
}

export function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

export function svgSize(svg: SVGSVGElement): { width: number; height: number } {
  return {
    width: Number(svg.getAttribute("width")) || svg.clientWidth,
    height: Number(svg.getAttribute("height")) || svg.clientHeight,
  };
}

export function svgToPngBlob(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const { width, height } = svgSize(svg);
  const url = URL.createObjectURL(new Blob([serializeSvg(svg)], { type: "image/svg+xml;charset=utf-8" }));

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas no disponible"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar el PNG"))), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo renderizar el SVG"));
    };
    img.src = url;
  });
}

export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// PowerPoint: every SVG element becomes a native, editable shape.
// ---------------------------------------------------------------------------

const SLIDE_W = 13.333; // 16:9, inches
const SLIDE_H = 7.5;
const SLIDE_MARGIN = 0.4;
const TITLE_H = 0.7;

/** Reads a presentation attribute, walking up to inherited values (e.g. <text fill> for its <tspan>s). */
function attr(el: Element, name: string): string | null {
  for (let node: Element | null = el; node && node.nodeName !== "#document"; node = node.parentElement) {
    const value = node.getAttribute(name);
    if (value !== null) return value;
    if (node.nodeName.toLowerCase() === "svg") break;
  }
  return null;
}

function num(el: Element, name: string, fallback = 0): number {
  const value = el.getAttribute(name);
  const parsed = value === null ? NaN : Number(value);
  return isNaN(parsed) ? fallback : parsed;
}

function hexColor(value: string | null): string | undefined {
  if (!value || value === "none" || !value.startsWith("#")) return undefined;
  const hex = value.slice(1);
  return (hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex).toUpperCase();
}

export async function downloadPptx(svg: SVGSVGElement, title: string, fileName: string) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = title;

  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  const fontFace = officeFont(svg.getAttribute("font-family"));
  const { width, height } = svgSize(svg);

  const availW = SLIDE_W - SLIDE_MARGIN * 2;
  const availH = SLIDE_H - SLIDE_MARGIN * 2 - TITLE_H;
  const k = Math.min(availW / width, availH / height); // inches per SVG px
  const offX = (SLIDE_W - width * k) / 2;
  const offY = SLIDE_MARGIN + TITLE_H + (availH - height * k) / 2;
  const X = (px: number) => offX + px * k;
  const Y = (px: number) => offY + px * k;
  const pt = (px: number) => Math.max(0.25, px * k * 72);

  slide.addText(title, {
    x: SLIDE_MARGIN,
    y: SLIDE_MARGIN,
    w: availW,
    h: TITLE_H - 0.1,
    fontFace,
    fontSize: 24,
    bold: true,
    color: "1E293B",
    valign: "middle",
    margin: 0,
  });

  function strokeOf(el: Element) {
    const dash = attr(el, "stroke-dasharray");
    return {
      color: hexColor(attr(el, "stroke")) ?? "000000",
      width: pt(Number(attr(el, "stroke-width") ?? 1)),
      ...(dash && dash !== "none" ? { dashType: "dash" as const } : {}),
    };
  }

  function addLine(el: Element, x1: number, y1: number, x2: number, y2: number) {
    slide.addShape(pptx.ShapeType.line, {
      x: X(Math.min(x1, x2)),
      y: Y(Math.min(y1, y2)),
      w: Math.abs(x2 - x1) * k,
      h: Math.abs(y2 - y1) * k,
      flipV: (x2 - x1) * (y2 - y1) < 0,
      line: strokeOf(el),
    });
  }

  for (const el of Array.from(svg.querySelectorAll("line, circle, rect, path, text"))) {
    switch (el.nodeName.toLowerCase()) {
      case "line":
        addLine(el, num(el, "x1"), num(el, "y1"), num(el, "x2"), num(el, "y2"));
        break;

      case "path": {
        // The chart only draws straight polylines ("M x y L x y ..."), so each
        // segment becomes its own line.
        const coords = (el.getAttribute("d") ?? "").match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
        for (let i = 2; i + 1 < coords.length; i += 2) {
          addLine(el, coords[i - 2], coords[i - 1], coords[i], coords[i + 1]);
        }
        break;
      }

      case "circle": {
        const r = num(el, "r");
        const stroke = hexColor(attr(el, "stroke"));
        slide.addShape(pptx.ShapeType.ellipse, {
          x: X(num(el, "cx") - r),
          y: Y(num(el, "cy") - r),
          w: r * 2 * k,
          h: r * 2 * k,
          fill: { color: hexColor(attr(el, "fill")) ?? "000000" },
          line: stroke ? strokeOf(el) : { type: "none" },
        });
        break;
      }

      case "rect": {
        const w = num(el, "width");
        const h = num(el, "height");
        const rx = num(el, "rx");
        slide.addShape(rx > 0 ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
          x: X(num(el, "x")),
          y: Y(num(el, "y")),
          w: w * k,
          h: h * k,
          fill: { color: hexColor(attr(el, "fill")) ?? "000000" },
          line: { type: "none" },
          ...(rx > 0 ? { rectRadius: rx * k } : {}),
        });
        break;
      }

      case "text": {
        const textEl = el as SVGTextElement;
        const tspans = Array.from(textEl.querySelectorAll("tspan"));
        const lines: Element[] = tspans.length > 0 ? tspans : [textEl];
        const runs = lines
          .map((line, i) => ({
            text: line.textContent ?? "",
            options: {
              bold: Number(attr(line, "font-weight") ?? 400) >= 600,
              color: hexColor(attr(line, "fill")) ?? "000000",
              fontSize: pt(Number(attr(line, "font-size") ?? 16)),
              breakLine: i < lines.length - 1,
            },
          }))
          .filter((run) => run.text.length > 0);
        if (runs.length === 0) break;

        const firstFontSize = Number(attr(lines[0], "font-size") ?? 16);
        const lineHeightPx = tspans.length > 1 ? num(tspans[1], "dy", firstFontSize * 1.2) : firstFontSize * 1.2;
        const baselineY = num(textEl, "y");
        const centered = attr(textEl, "text-anchor") === "middle";

        // Generous horizontal padding: Office's font metrics differ slightly
        // from the browser's, and with wrap disabled the extra room is harmless.
        const bbox = textEl.getBBox();
        const padPx = bbox.width * 0.15 + 8;
        const boxW = bbox.width + padPx * 2;
        const boxX = centered ? bbox.x + bbox.width / 2 - boxW / 2 : bbox.x;

        slide.addText(runs, {
          x: X(boxX),
          y: Y(baselineY - lineHeightPx * 0.8),
          w: boxW * k,
          h: lines.length * lineHeightPx * k,
          fontFace,
          align: centered ? "center" : "left",
          valign: "top",
          lineSpacing: pt(lineHeightPx),
          margin: 0,
          wrap: false,
        });
        break;
      }
    }
  }

  await pptx.writeFile({ fileName: `${fileName}.pptx` });
}

// ---------------------------------------------------------------------------
// Word: the chart as an SVG picture (Word 365 can "Convert to Shape" it) plus
// the data as a native, editable table.
// ---------------------------------------------------------------------------

const A4_LANDSCAPE_TWIP = { width: 16838, height: 11906 };
const PAGE_MARGIN_TWIP = 1000;
const TWIP_PER_PX = 15; // 1440 twip/in ÷ 96 px/in

export async function downloadDocx(
  svg: SVGSVGElement,
  title: string,
  items: ChartItem[],
  groups: TimelineGroup[],
  fileName: string
) {
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    HeadingLevel,
    PageOrientation,
    ShadingType,
    AlignmentType,
  } = docx;

  const font = officeFont(svg.getAttribute("font-family"));
  const { width, height } = svgSize(svg);
  const pngBytes = new Uint8Array(await (await svgToPngBlob(svg)).arrayBuffer());
  const svgBytes = new TextEncoder().encode(serializeSvg(svg));

  const maxW = (A4_LANDSCAPE_TWIP.width - PAGE_MARGIN_TWIP * 2) / TWIP_PER_PX;
  const maxH = (A4_LANDSCAPE_TWIP.height - PAGE_MARGIN_TWIP * 2) / TWIP_PER_PX - 80; // leave room for the title
  const fit = Math.min(1, maxW / width, maxH / height);
  const transformation = { width: Math.round(width * fit), height: Math.round(height * fit) };

  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "";
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

  const cell = (text: string, header = false) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: header, font, size: 20 })] })],
      ...(header ? { shading: { type: ShadingType.CLEAR, color: "auto", fill: "E2E8F0" } } : {}),
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
    });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["Fecha", "Encabezado", "Hito", "Grupo"].map((h) => cell(h, true)),
      }),
      ...sorted.map(
        (item) =>
          new TableRow({
            children: [
              cell(item.date ? formatDate(new Date(item.date + "T00:00:00")) : ""),
              cell(item.encabezado),
              cell(item.hito),
              cell(groupName(item.grupoId)),
            ],
          })
      ),
    ],
  });

  const doc = new Document({
    creator: "RutaPRO",
    title,
    styles: { default: { document: { run: { font } } } },
    sections: [
      {
        properties: {
          page: {
            // docx swaps width/height itself for landscape, so pass portrait dimensions.
            size: {
              width: A4_LANDSCAPE_TWIP.height,
              height: A4_LANDSCAPE_TWIP.width,
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: PAGE_MARGIN_TWIP,
              bottom: PAGE_MARGIN_TWIP,
              left: PAGE_MARGIN_TWIP,
              right: PAGE_MARGIN_TWIP,
            },
          },
        },
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: title, font })] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: "svg",
                data: svgBytes,
                transformation,
                fallback: { type: "png", data: pngBytes },
                altText: { name: title, title, description: `Línea de tiempo: ${title}` },
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: true,
            children: [new TextRun({ text: "Datos", font })],
          }),
          table,
        ],
      },
    ],
  });

  triggerDownload(await Packer.toBlob(doc), `${fileName}.docx`);
}
