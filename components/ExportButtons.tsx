"use client";

import { RefObject, useState } from "react";
import type { ChartItem } from "@/components/TimelineChart";
import type { TimelineGroup } from "@/lib/palette";
import {
  downloadDocx,
  downloadPptx,
  serializeSvg,
  svgToPngBlob,
  triggerDownload,
} from "@/lib/office-export";

interface Props {
  svgRef: RefObject<SVGSVGElement | null>;
  fileName: string;
  title: string;
  items: ChartItem[];
  groups: TimelineGroup[];
}

type Format = "pptx" | "docx";

export default function ExportButtons({ svgRef, fileName, title, items, groups }: Props) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);

  function downloadSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const blob = new Blob([serializeSvg(svg)], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(blob, `${fileName}.svg`);
  }

  async function downloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    triggerDownload(await svgToPngBlob(svg), `${fileName}.png`);
  }

  async function downloadOffice(format: Format) {
    const svg = svgRef.current;
    if (!svg || busy) return;
    setBusy(format);
    setError(null);
    try {
      if (format === "pptx") await downloadPptx(svg, title, fileName);
      else await downloadDocx(svg, title, items, groups, fileName);
    } catch (err) {
      console.error(err);
      setError(`No se pudo generar el archivo ${format === "pptx" ? "PowerPoint" : "Word"}.`);
    } finally {
      setBusy(null);
    }
  }

  const outline =
    "rounded border border-brand-primary px-3 py-1.5 text-sm text-brand-primary hover:bg-brand-primary/5 disabled:opacity-50";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button onClick={downloadSvg} className={outline}>
          Descargar SVG
        </button>
        <button
          onClick={downloadPng}
          className="rounded bg-brand-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-primaryDark"
        >
          Descargar PNG
        </button>
        <button onClick={() => downloadOffice("pptx")} disabled={busy !== null} className={outline}>
          {busy === "pptx" ? "Generando…" : "Descargar PowerPoint"}
        </button>
        <button onClick={() => downloadOffice("docx")} disabled={busy !== null} className={outline}>
          {busy === "docx" ? "Generando…" : "Descargar Word"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
