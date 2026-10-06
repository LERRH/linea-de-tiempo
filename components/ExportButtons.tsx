"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { downloadPptx, serializeSvg, svgToPngBlob, triggerDownload } from "@/lib/pptx-export";

interface Props {
  svgRef: RefObject<SVGSVGElement | null>;
  fileName: string;
  title: string;
}

/** "Exportar ▾" dropdown: SVG, PNG and editable PowerPoint. */
export default function ExportButtons({ svgRef, fileName, title }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function run(action: (svg: SVGSVGElement) => Promise<void> | void, label: string) {
    const svg = svgRef.current;
    if (!svg || busy) return;
    setOpen(false);
    setBusy(true);
    setError(null);
    try {
      await action(svg);
    } catch (err) {
      console.error(err);
      setError(`No se pudo generar el archivo ${label}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        className="btn btn-primary"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {busy ? "Generando…" : "Exportar ▾"}
      </button>
      {open && (
        <div className="dropdown-menu card" role="menu">
          <button role="menuitem" onClick={() => run((svg) => downloadPptx(svg, title, fileName), "PowerPoint")}>
            PowerPoint (editable)
          </button>
          <button
            role="menuitem"
            onClick={() => run(async (svg) => triggerDownload(await svgToPngBlob(svg), `${fileName}.png`), "PNG")}
          >
            Imagen PNG
          </button>
          <button
            role="menuitem"
            onClick={() =>
              run(
                (svg) =>
                  triggerDownload(
                    new Blob([serializeSvg(svg)], { type: "image/svg+xml;charset=utf-8" }),
                    `${fileName}.svg`
                  ),
                "SVG"
              )
            }
          >
            Vector SVG
          </button>
        </div>
      )}
      {error && (
        <div className="dropdown-menu error" role="alert" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
  );
}
