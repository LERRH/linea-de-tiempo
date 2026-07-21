import { prisma } from "@/lib/prisma";

export type AccessLevel = "OWNER" | "EDIT" | "VIEW" | null;

export async function getAccessLevel(timelineId: string, userId: string): Promise<AccessLevel> {
  const timeline = await prisma.timeline.findUnique({
    where: { id: timelineId },
    select: {
      ownerId: true,
      shares: { where: { sharedWithUserId: userId }, select: { permission: true } },
    },
  });

  if (!timeline) return null;
  if (timeline.ownerId === userId) return "OWNER";
  if (timeline.shares.length > 0) return timeline.shares[0].permission;
  return null;
}

export function canEdit(level: AccessLevel): boolean {
  return level === "OWNER" || level === "EDIT";
}

export function canView(level: AccessLevel): boolean {
  return level !== null;
}
