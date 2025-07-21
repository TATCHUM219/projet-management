import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // traite la mise à jour du message ici
  return NextResponse.json({ success: true });
} 