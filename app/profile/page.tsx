"use client";
import { useUser } from "@clerk/nextjs";
import Wrapper from "../components/Wrapper";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const { user } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [taskStats, setTaskStats] = useState({ done: 0, total: 0 });
  const [projectsCount, setProjectsCount] = useState(0);

  useEffect(() => {
    const fetchRoleAndStats = async () => {
      if (!user) return;
      // Rôle
      const res = await fetch(`/api/user/${user.id}`);
      const data = await res.json();
      setRole(data.role);
      // Stats
      const statsRes = await fetch(`/api/user/${user.id}/stats`);
      const stats = await statsRes.json();
      setTaskStats(stats.tasks);
      setProjectsCount(stats.projectsCreated);
    };
    fetchRoleAndStats();
  }, [user]);

  if (!user) return null;

  return (
    <Wrapper>
      <div className="max-w-xl mx-auto bg-base-100 p-8 rounded-xl shadow">
        <div className="flex items-center mb-6">
          <Image src={user.imageUrl || "/profile.avif"} alt="avatar" width={80} height={80} className="rounded-full mr-4" />
          <div>
            <div className="text-xl font-bold">{user.fullName}</div>
            <div className="text-gray-500">{user.primaryEmailAddress?.emailAddress}</div>
            <div className="badge badge-primary mt-2">Rôle : {role || "-"}</div>
          </div>
        </div>
        <div className="divider">Statistiques</div>
        <div className="flex flex-col gap-2">
          <div>
            <span className="font-semibold">Tâches accomplies :</span> {taskStats?.done ?? 0} / {taskStats?.total ?? 0}
          </div>
          <div>
            <span className="font-semibold">Projets créés :</span> {projectsCount}
          </div>
        </div>
        <div className="divider">Actions</div>
        <a href="/user" className="btn btn-outline btn-primary w-full">Modifier mon profil (Clerk)</a>
      </div>
    </Wrapper>
  );
} 