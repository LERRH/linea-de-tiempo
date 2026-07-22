"use client";

import { RefObject } from "react";

interface Props {
  svgRef: RefObject<SVGSVGElement | null>;
  fileName: string;
}

function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ svgRef, fileName }: Props) {
  function downloadSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const svgString = serializeSvg(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(blob, `${fileName}.svg`);
  }

  function downloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    const svgString = serializeSvg(svg);
    const width = Number(svg.getAttribute("width")) || svg.clientWidth;
    const height = Number(svg.getAttribute("height")) || svg.clientHeight;
    const scale = 2;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `${fileName}.png`);
      }, "image/png");
    };
    img.src = url;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadSvg}
        className="rounded border border-brand-primary px-3 py-1.5 text-sm text-brand-primary hover:bg-brand-primary/5"
      >
        Descargar SVG
      </button>
      <button
        onClick={downloadPng}
        className="rounded bg-brand-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-primaryDark"
      >
        Descargar PNG
      </button>
    </div>
  );
}
