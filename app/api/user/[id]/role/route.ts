import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/app/actions';

export async function PUT() {
  // ... logique existante à adapter si besoin ...
  return Response.json({});
} 