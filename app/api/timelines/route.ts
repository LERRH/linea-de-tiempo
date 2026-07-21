import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STYLE } from "@/lib/palette";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const owned = await prisma.timeline.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  const shared = await prisma.timeline.findMany({
    where: { shares: { some: { sharedWithUserId: session.user.id } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      owner: { select: { email: true, name: true } },
      shares: { where: { sharedWithUserId: session.user.id }, select: { permission: true } },
    },
  });

  return NextResponse.json({ owned, shared });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "Nueva línea de tiempo";

  const timeline = await prisma.timeline.create({
    data: {
      title,
      style: DEFAULT_STYLE as unknown as Prisma.InputJsonValue,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(timeline);
}
