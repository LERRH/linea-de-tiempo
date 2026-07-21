/*
  Warnings:

  - You are about to drop the column `etapa` on the `TimelineItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TimelineItem" DROP COLUMN "etapa",
ADD COLUMN     "encabezado" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "grupoId" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "hito" SET DEFAULT '';
