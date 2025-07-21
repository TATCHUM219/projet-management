import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url!);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  if (projectId) {
    // Nombre de messages non lus pour un projet spécifique
    const count = await prisma.message.count({
      where: { 
        receiverId: userId, 
        projectId,
        read: false 
      }
    });
    return NextResponse.json({ count });
  } else {
    // Nombre total de messages non lus pour tous les projets
    const count = await prisma.message.count({
      where: { 
        receiverId: userId, 
        read: false 
      }
    });
    return NextResponse.json({ count });
  }
} 