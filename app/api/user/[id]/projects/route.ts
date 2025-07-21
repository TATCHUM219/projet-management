import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  // ... logique existante à adapter si besoin ...
  return Response.json({});
} 