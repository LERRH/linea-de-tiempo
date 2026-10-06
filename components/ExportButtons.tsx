"use client";

import { RefObject, useState } from "react";
import { downloadPptx, serializeSvg, svgToPngBlob, triggerDownload } from "@/lib/pptx-export";

interface Props {
  svgRef: RefObject<SVGSVGElement | null>;
  fileName: string;
  title: string;
}

export default function ExportButtons({ svgRef, fileName, title }: Props) {
  const [busy, setBusy] = useState(false);
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

  async function downloadPowerPoint() {
    const svg = svgRef.current;
    if (!svg || busy) return;
    setBusy(true);
    setError(null);
    try {
      await downloadPptx(svg, title, fileName);
    } catch (err) {
      console.error(err);
      setError("No se pudo generar el archivo PowerPoint.");
    } finally {
      setBusy(false);
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
        <button onClick={downloadPowerPoint} disabled={busy} className={outline}>
          {busy ? "Generando…" : "Descargar PowerPoint"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
