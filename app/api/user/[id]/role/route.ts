import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/app/actions';

export async function PUT(req, { params }) {
  const { id } = params;
  const { role } = await req.json();
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const myRole = await getUserRole(userId);
  if (myRole !== 'ADMIN') return NextResponse.json({ error: 'Permission refusée : admin uniquement' }, { status: 403 });
  if (!role) return NextResponse.json({ error: 'Role requis' }, { status: 400 });
  const user = await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json({ success: true, user });
} 