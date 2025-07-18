import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/resource/assign : assigne une ressource à une tâche
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { taskId, resourceId, quantity } = data;
  if (!taskId || !resourceId) {
    return NextResponse.json({ error: 'taskId et resourceId requis' }, { status: 400 });
  }
  const taskResource = await prisma.taskResource.create({
    data: { taskId, resourceId, quantity },
  });
  return NextResponse.json(taskResource);
} 