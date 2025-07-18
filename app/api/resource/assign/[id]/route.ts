import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/resource/assign/[id] : supprimer une assignation de ressource à une tâche
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.taskResource.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 