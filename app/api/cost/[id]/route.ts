import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/cost/[id] : récupérer un coût
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const cost = await prisma.cost.findUnique({ where: { id } });
  if (!cost) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cost);
}

// PUT /api/cost/[id] : mettre à jour un coût
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const data = await req.json();
  const cost = await prisma.cost.update({ where: { id }, data });
  return NextResponse.json(cost);
}

// DELETE /api/cost/[id] : supprimer un coût
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.cost.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 