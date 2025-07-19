import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/cost/[id] : récupérer un coût
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cost = await prisma.cost.findUnique({ where: { id } });
  if (!cost) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cost);
}

// PUT /api/cost/[id] : mettre à jour un coût
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const cost = await prisma.cost.update({ where: { id }, data });
  return NextResponse.json(cost);
}

// DELETE /api/cost/[id] : supprimer un coût
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.cost.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 