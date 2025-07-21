import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { senderId, receiverId, projectId, content, broadcast } = await req.json();
  if (!senderId || !projectId || !content) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  // Vérifier que l'expéditeur est membre du projet
  const senderMember = await prisma.projectUser.findFirst({
    where: { userId: senderId, projectId }
  });
  if (!senderMember) {
    return NextResponse.json({ error: 'L\'expéditeur doit être membre du projet' }, { status: 403 });
  }

  if (broadcast) {
    // Récupérer tous les membres du projet sauf l'expéditeur
    const members = await prisma.projectUser.findMany({
      where: { projectId, NOT: { userId: senderId } },
      select: { userId: true }
    });
    const messages = await prisma.$transaction(
      members.map((m) =>
        prisma.message.create({
          data: {
            senderId,
            receiverId: m.userId,
            projectId,
            content
          }
        })
      )
    );
    return NextResponse.json(messages);
  }

  // Message classique (un destinataire)
  if (!receiverId) {
    return NextResponse.json({ error: 'receiverId requis si pas de diffusion' }, { status: 400 });
  }
  // Vérifier que le destinataire est membre du projet
  const receiverMember = await prisma.projectUser.findFirst({
    where: { userId: receiverId, projectId }
  });
  if (!receiverMember) {
    return NextResponse.json({ error: 'Le destinataire doit être membre du projet' }, { status: 403 });
  }
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