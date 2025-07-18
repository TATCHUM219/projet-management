// app/api/auth/create-user/route.ts

import { currentUser } from "@clerk/nextjs/server";
import  prisma  from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json({ message: "User already exists" });
  }

  // 🎯 Logique pour définir le rôle
  let role = "USER";
  if (email == "tatchumkamgajordandouglas@gmail.com") {
    role = "ADMIN";
  } else if (email.endsWith("@gmail.com")) {
    role = "USER";
  }

  const newUser = await prisma.user.create({
    data: {
      id: clerkUser.id, // Clerk user ID comme identifiant principal
      email,
      name,
      role,
    },
  });

  return NextResponse.json({ message: "User created", user: newUser });
}
