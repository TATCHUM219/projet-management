import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url!);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');
  if (!userId || !projectId) {
    return NextResponse.json({ error: 'userId et projectId requis' }, { status: 400 });
  }
  const messages = await prisma.message.findMany({
    where: { senderId: userId, projectId },
    orderBy: { createdAt: 'desc' },
    include: { receiver: true }
  });
  return NextResponse.json(messages);
} 