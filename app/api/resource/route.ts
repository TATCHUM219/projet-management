import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/resource : liste toutes les ressources
export async function GET() {
  const resources = await prisma.resource.findMany();
  return NextResponse.json(resources);
}

// POST /api/resource : crée une nouvelle ressource
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, type, cost, projectId } = data;
  if (!name || !type || !cost) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }
  const resource = await prisma.resource.create({
    data: { name, type, cost, projectId },
  });
  return NextResponse.json(resource);
} 