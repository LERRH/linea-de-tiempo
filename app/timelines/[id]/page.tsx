import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessLevel } from "@/lib/permissions";
import { DEFAULT_STYLE, TimelineStyle } from "@/lib/palette";
import TimelineEditor from "@/components/TimelineEditor";

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const accessLevel = await getAccessLevel(id, session.user.id);
  if (!accessLevel) notFound();

  const timeline = await prisma.timeline.findUnique({
    where: { id },
    include: {
      items: { orderBy: { date: "asc" } },
      shares: { include: { sharedWithUser: { select: { email: true, name: true } } } },
      owner: { select: { email: true, name: true } },
    },
  });

  if (!timeline) notFound();

  const style: TimelineStyle = {
    ...DEFAULT_STYLE,
    ...(timeline.style as Partial<TimelineStyle>),
  };

  const items = timeline.items.map((item) => ({
    date: item.date.toISOString().slice(0, 10),
    encabezado: item.encabezado,
    hito: item.hito,
    grupoId: item.grupoId,
  }));

  const shares = timeline.shares.map((s) => ({
    id: s.id,
    permission: s.permission,
    sharedWithUser: s.sharedWithUser,
  }));

  return (
    <TimelineEditor
      timelineId={timeline.id}
      initialTitle={timeline.title}
      initialItems={items}
      initialStyle={style}
      initialShares={shares}
      accessLevel={accessLevel}
      ownerLabel={timeline.owner.name || timeline.owner.email}
    />
  );
}
