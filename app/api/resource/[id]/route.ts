import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/resource/[id] : récupérer une ressource
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(resource);
}

// PUT /api/resource/[id] : mettre à jour une ressource
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const resource = await prisma.resource.update({ where: { id }, data });
  return NextResponse.json(resource);
}

// DELETE /api/resource/[id] : supprimer une ressource
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.resource.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 