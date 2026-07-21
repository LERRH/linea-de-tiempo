import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessLevel, canEdit } from "@/lib/permissions";
import type { TimelineItemInput } from "@/lib/types";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const level = await getAccessLevel(id, session.user.id);
  if (!canEdit(level)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const items: TimelineItemInput[] = Array.isArray(body?.items) ? body.items : [];

  const valid = items.filter((item) => item && typeof item.date === "string");

  await prisma.$transaction([
    prisma.timelineItem.deleteMany({ where: { timelineId: id } }),
    prisma.timelineItem.createMany({
      data: valid.map((item, index) => ({
        timelineId: id,
        date: new Date(item.date),
        grupoId: item.grupoId?.trim() || "",
        encabezado: item.encabezado?.trim() || "",
        hito: item.hito?.trim() || "",
        order: index,
      })),
    }),
  ]);

  await prisma.timeline.update({ where: { id }, data: { updatedAt: new Date() } });

  const updated = await prisma.timelineItem.findMany({
    where: { timelineId: id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ items: updated });
}
