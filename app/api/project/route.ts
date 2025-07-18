import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/app/actions';

// GET /api/project : liste tous les projets
export async function GET() {
  const projects = await prisma.project.findMany({ select: { id: true, name: true, chefDeProjetId: true } });
  return NextResponse.json(projects);
}

// POST /api/project/assign-chef : affecter un chef de projet à un projet
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const role = await getUserRole(userId);
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Permission refusée : admin uniquement' }, { status: 403 });
  const { projectId, chefId } = await req.json();
  if (!projectId || !chefId) return NextResponse.json({ error: 'Champs requis' }, { status: 400 });
  const chef = await prisma.user.findUnique({ where: { id: chefId } });
  if (!chef || chef.role !== 'CHEF') return NextResponse.json({ error: 'L\'utilisateur sélectionné n\'est pas un chef de projet' }, { status: 400 });
  await prisma.project.update({ where: { id: projectId }, data: { chefDeProjetId: chefId } });
  return NextResponse.json({ success: true });
} 