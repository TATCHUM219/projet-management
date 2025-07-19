import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Trouver l'utilisateur par id
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  // Tâches accomplies
  const doneCount = await prisma.task.count({ where: { userId: id, status: 'Done' } });
  const totalCount = await prisma.task.count({ where: { userId: id } });
  // Projets créés
  const projectsCreated = await prisma.project.count({ where: { createdById: id } });
  return NextResponse.json({ tasks: { done: doneCount, total: totalCount }, projectsCreated });
} 