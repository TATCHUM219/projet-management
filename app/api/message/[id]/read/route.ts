import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const messageId = params.id;
  try {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { read: true }
    });
    return NextResponse.json(message);
  } catch {
    return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });
  }
} 