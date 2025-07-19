import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/app/actions';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const role = await getUserRole(userId);
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Permission refusée : admin uniquement' }, { status: 403 });
  const { name, description, chefId } = await req.json();
  const data: unknown = {};
  if (name) data.name = name;
  if (description !== undefined) data.description = description;
  if (chefId !== undefined) data.chefDeProjetId = chefId;
  await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ success: true });
} 