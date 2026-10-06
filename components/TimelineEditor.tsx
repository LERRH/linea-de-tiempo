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

type PanelTab = "estilos" | "grupos" | "compartir";

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
  const [panelTab, setPanelTab] = useState<PanelTab>("estilos");

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

  const tabs: { id: PanelTab; label: string }[] = [
    ...(editable ? [{ id: "estilos" as const, label: "Estilos" }] : []),
    { id: "grupos", label: "Grupos" },
    ...(isOwner ? [{ id: "compartir" as const, label: "Compartir" }] : []),
  ];
  const activeTab = tabs.some((t) => t.id === panelTab) ? panelTab : tabs[0].id;

  const saveLabel = saving
    ? "Guardando…"
    : dirty
    ? "Cambios sin guardar"
    : savedAt
    ? `✓ Guardado ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "✓ Todo guardado";

  return (
    <div className="editor">
      <header className="editor-top">
        <Logo />
        <Link href="/" className="small whitespace-nowrap">
          ‹ Volver
        </Link>
        {editable ? (
          <input
            className="title-edit"
            aria-label="Título de la línea de tiempo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        ) : (
          <strong className="truncate">{title}</strong>
        )}
        <div className="top-spacer" />
        {editable ? (
          <span className="saved" aria-live="polite">
            {saveLabel}
          </span>
        ) : (
          <span className="saved">Solo lectura · compartida por {ownerLabel}</span>
        )}
        {isOwner && (
          <button className="btn btn-outline share-btn" onClick={() => setPanelTab("compartir")}>
            Compartir
          </button>
        )}
        <ExportButtons svgRef={svgRef} fileName={title || "linea-de-tiempo"} title={title || "Línea de tiempo"} />
      </header>

      <div className="editor-grid">
        <main className="workspace">
          <section className="chart-card card">
            <div className="chart-head">
              <div>
                <h1>{title || "Línea de tiempo"}</h1>
                <span className="muted">
                  Línea de tiempo del proyecto · {items.length} {items.length === 1 ? "hito" : "hitos"}
                  {!isOwner && ` · de ${ownerLabel}`}
                </span>
              </div>
            </div>
            <div className="chart-scroll">
              <TimelineChart ref={svgRef} items={items} style={style} />
            </div>
          </section>

          <TimelineTable
            items={items}
            onChange={setItems}
            editable={editable}
            groups={style.groups}
            onGroupsChange={(groups) => setStyle({ ...style, groups })}
            fileName={title}
          />
        </main>

        <aside className="sidepanel card">
          <div className="panel-tabs" role="tablist" style={{ "--tabs": tabs.length } as React.CSSProperties}>
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                className={activeTab === t.id ? "active" : ""}
                onClick={() => setPanelTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "estilos" && editable && <StylePanel style={style} onChange={setStyle} />}
          {activeTab === "grupos" && (
            <GroupsPanel
              groups={style.groups}
              onChange={(groups) => setStyle({ ...style, groups })}
              editable={editable}
            />
          )}
          {activeTab === "compartir" && isOwner && (
            <SharePanel timelineId={timelineId} shares={shares} onChange={setShares} />
          )}

          {isOwner && (
            <div className="panel-section">
              <button className="btn btn-danger btn-sm w-full" onClick={deleteTimeline} disabled={deleting}>
                {deleting ? "Eliminando…" : "Eliminar línea de tiempo"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
