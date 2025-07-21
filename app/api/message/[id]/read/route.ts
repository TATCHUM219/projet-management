import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const messageId = params.id;
  // traite la mise à jour du message ici
  return NextResponse.json({ success: true });
} 