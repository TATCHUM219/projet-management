// app/api/user/[id]/route.ts
import  prisma  from "@/lib/prisma"; // ou `import prisma from "@/lib/prisma"` selon ton export
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ role: user.role });
}
