import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/cost?projectId=... : liste les coûts d'un projet
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
  const costs = await prisma.cost.findMany({ where: { projectId } });
  return NextResponse.json(costs);
}

// POST /api/cost : crée un coût pour un projet
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { projectId, budget, spent } = data;
  if (!projectId || budget === undefined || spent === undefined) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }
  const cost = await prisma.cost.create({ data: { projectId, budget, spent } });
  return NextResponse.json(cost);
} 