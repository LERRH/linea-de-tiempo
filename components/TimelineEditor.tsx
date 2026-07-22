"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TimelineChart, { ChartItem } from "@/components/TimelineChart";
import TimelineTable from "@/components/TimelineTable";
import StylePanel from "@/components/StylePanel";
import GroupsPanel from "@/components/GroupsPanel";
import ExportButtons from "@/components/ExportButtons";
import SharePanel, { ShareEntry } from "@/components/SharePanel";
import Logo from "@/components/Logo";
import { TimelineStyle } from "@/lib/palette";
import type { AccessLevel } from "@/lib/permissions";

interface Props {
  timelineId: string;
  initialTitle: string;
  initialItems: ChartItem[];
  initialStyle: TimelineStyle;
  initialShares: ShareEntry[];
  accessLevel: AccessLevel;
  ownerLabel: string;
}

export default function TimelineEditor({
  timelineId,
  initialTitle,
  initialItems,
  initialStyle,
  initialShares,
  accessLevel,
  ownerLabel,
}: Props) {
  const router = useRouter();
  const editable = accessLevel === "OWNER" || accessLevel === "EDIT";
  const isOwner = accessLevel === "OWNER";

  const [title, setTitle] = useState(initialTitle);
  const [items, setItems] = useState<ChartItem[]>(initialItems);
  const [style, setStyle] = useState<TimelineStyle>(initialStyle);
  const [shares, setShares] = useState<ShareEntry[]>(initialShares);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [deleting, setDeleting] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const isFirstRender = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef({ title, items, style });

  useEffect(() => {
    latestData.current = { title, items, style };
  }, [title, items, style]);

  async function save() {
    setSaving(true);
    const { title: t, items: it, style: st } = latestData.current;
    await Promise.all([
      fetch(`/api/timelines/${timelineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, style: st }),
      }),
      fetch(`/api/timelines/${timelineId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: it }),
      }),
    ]);
    setSaving(false);
    setDirty(false);
    setSavedAt(new Date());
  }

  // Autosave shortly after any change, so edits aren't lost if the tab is closed before a manual save.
  useEffect(() => {
    if (!editable) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setDirty(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save() always reads fresh state via latestData ref
  }, [title, items, style, editable]);

  // Flush any pending autosave when the tab is hidden or closed.
  useEffect(() => {
    if (!editable) return;
    function flush() {
      if (!dirty) return;
      const { title: t, items: it, style: st } = latestData.current;
      fetch(`/api/timelines/${timelineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, style: st }),
        keepalive: true,
      });
      fetch(`/api/timelines/${timelineId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: it }),
        keepalive: true,
      });
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [editable, timelineId, dirty]);

  async function deleteTimeline() {
    if (!confirm("¿Eliminar esta línea de tiempo? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    await fetch(`/api/timelines/${timelineId}`, { method: "DELETE" });
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-brand-surface">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo />
          <Link href="/" className="text-sm font-medium text-brand-accent hover:underline">
            ← Volver
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {!isOwner && <p className="mb-4 text-sm text-slate-500">Compartida por {ownerLabel}</p>}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {editable ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full max-w-md rounded border border-slate-200 px-3 py-2 text-xl font-semibold text-brand-ink outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
            />
          ) : (
            <h1 className="text-xl font-semibold text-brand-ink">{title}</h1>
          )}

          <div className="flex items-center gap-3">
            {editable && (
              <span className="text-xs text-slate-400">
                {saving
                  ? "Guardando..."
                  : dirty
                  ? "Cambios sin guardar"
                  : savedAt
                  ? `Guardado automáticamente ${savedAt.toLocaleTimeString()}`
                  : "Sin cambios"}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6 overflow-x-auto rounded-xl border border-black/5 bg-white p-4 shadow-sm">
          <TimelineChart ref={svgRef} items={items} style={style} />
        </div>

        <div className="mb-6">
          <ExportButtons svgRef={svgRef} fileName={title || "linea-de-tiempo"} />
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-brand-ink">Datos</h2>
          <TimelineTable
            items={items}
            onChange={setItems}
            editable={editable}
            columns={style.columns}
            onColumnsChange={(columns) => setStyle({ ...style, columns })}
            groups={style.groups}
          />
        </div>

        <div className="mb-6">
          <GroupsPanel
            groups={style.groups}
            onChange={(groups) => setStyle({ ...style, groups })}
            editable={editable}
          />
        </div>

        <div className="mb-6">
          <StylePanel style={style} onChange={setStyle} editable={editable} />
        </div>

        {isOwner && (
          <div className="mb-6">
            <SharePanel timelineId={timelineId} shares={shares} onChange={setShares} />
          </div>
        )}

        {isOwner && (
          <button
            onClick={deleteTimeline}
            disabled={deleting}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar línea de tiempo"}
          </button>
        )}
      </div>
    </main>
  );
}
