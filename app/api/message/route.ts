import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { senderId, receiverId, projectId, content } = await req.json();
  if (!senderId || !receiverId || !projectId || !content) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  // Vérifier que les deux utilisateurs sont membres du projet
  const senderMember = await prisma.projectUser.findFirst({
    where: { userId: senderId, projectId }
  });
  const receiverMember = await prisma.projectUser.findFirst({
    where: { userId: receiverId, projectId }
  });
  if (!senderMember || !receiverMember) {
    return NextResponse.json({ error: 'Les deux utilisateurs doivent être membres du projet' }, { status: 403 });
  }

  // Créer le message
  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      projectId,
      content
    }
  });
  return NextResponse.json(message);
} 