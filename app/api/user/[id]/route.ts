// app/api/user/[id]/route.ts
import  prisma  from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let user;
  if (id.includes('@')) {
    user = await prisma.user.findUnique({ where: { email: id }, select: { role: true } });
  } else {
    user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  }
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ role: user.role });
}
