import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessLevel } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const level = await getAccessLevel(id, session.user.id);
  if (level !== "OWNER") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const permission = body?.permission === "EDIT" ? "EDIT" : "VIEW";

  if (!identifier) {
    return NextResponse.json({ error: "Escribe un email o nombre de usuario." }, { status: 400 });
  }

  const targetUser = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { name: identifier }] },
  });
  if (!targetUser) {
    return NextResponse.json(
      { error: "No hay ninguna cuenta registrada con ese email o nombre de usuario." },
      { status: 404 }
    );
  }

  if (targetUser.id === session.user.id) {
    return NextResponse.json({ error: "No puedes compartir contigo mismo." }, { status: 400 });
  }

  const share = await prisma.timelineShare.upsert({
    where: { timelineId_sharedWithUserId: { timelineId: id, sharedWithUserId: targetUser.id } },
    update: { permission },
    create: { timelineId: id, sharedWithUserId: targetUser.id, permission },
    include: { sharedWithUser: { select: { email: true, name: true } } },
  });

  return NextResponse.json(share);
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const level = await getAccessLevel(id, session.user.id);
  if (level !== "OWNER") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");
  if (!shareId) return NextResponse.json({ error: "shareId requerido" }, { status: 400 });

  await prisma.timelineShare.delete({ where: { id: shareId } });

  return NextResponse.json({ ok: true });
}
