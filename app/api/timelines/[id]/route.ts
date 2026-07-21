import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessLevel, canEdit } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const level = await getAccessLevel(id, session.user.id);
  if (!level) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const timeline = await prisma.timeline.findUnique({
    where: { id },
    include: {
      items: { orderBy: { date: "asc" } },
      shares: { include: { sharedWithUser: { select: { email: true, name: true } } } },
      owner: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({ timeline, accessLevel: level });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const level = await getAccessLevel(id, session.user.id);
  if (!canEdit(level)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: { title?: string; style?: object } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.style && typeof body.style === "object") data.style = body.style;

  const timeline = await prisma.timeline.update({
    where: { id },
    data,
  });

  return NextResponse.json(timeline);
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const level = await getAccessLevel(id, session.user.id);
  if (level !== "OWNER") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  await prisma.timeline.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
