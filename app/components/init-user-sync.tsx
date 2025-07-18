"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export function InitUserSync() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    // Appel à l'API pour créer/synchroniser l'utilisateur Prisma
    fetch("/api/auth/create-user", {
      method: "POST",
    });
  }, [user]);

  return null;
}
