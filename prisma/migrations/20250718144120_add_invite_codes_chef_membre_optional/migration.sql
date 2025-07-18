/*
  Warnings:

  - A unique constraint covering the columns `[inviteCodeChef]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inviteCodeMembre]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN "inviteCodeChef" TEXT;
ALTER TABLE "Project" ADD COLUMN "inviteCodeMembre" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_inviteCodeChef_key" ON "Project"("inviteCodeChef");

-- CreateIndex
CREATE UNIQUE INDEX "Project_inviteCodeMembre_key" ON "Project"("inviteCodeMembre");
