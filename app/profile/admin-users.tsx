"use client";
import { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { toast } from "react-toastify";
import { Project } from "@/type";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedChef, setSelectedChef] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/user");
    const data = await res.json();
    setUsers(data);
    setChefs(data.filter((u: any) => u.role === "CHEF"));
    setLoading(false);
  };
  const fetchProjects = async () => {
    const res = await fetch("/api/project");
    const data = await res.json();
    setProjects(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const handleRoleChange = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/user/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes('Permission refusée')) {
          toast.error("Vous n'avez pas la permission de modifier le rôle.");
        } else if (data.error?.includes('Non authentifié')) {
          toast.error("Vous devez être connecté comme admin.");
        } else {
          toast.error(data.error || "Erreur lors du changement de rôle.");
        }
        return;
      }
      toast.success("Rôle modifié");
      fetchUsers();
    } catch (e) {
      toast.error("Erreur lors du changement de rôle.");
    }
  };

  const handleAssignChef = async () => {
    if (!selectedProject || !selectedChef) {
      toast.error("Sélectionnez un projet et un chef de projet.");
      return;
    }
    const res = await fetch("/api/project/assign-chef", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject, chefId: selectedChef })
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erreur lors de l'affectation du chef de projet.");
      return;
    }
    toast.success("Chef de projet affecté !");
    fetchProjects();
  };

  return (
    <Wrapper>
      <div className="max-w-2xl mx-auto bg-base-100 p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6">Gestion des utilisateurs</h1>
        {/* Affectation chef de projet */}
        <div className="mb-8">
          <h2 className="font-bold mb-2">Affecter un chef de projet à un projet</h2>
          <div className="flex gap-2 mb-2">
            <select className="select select-bordered" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">Projet...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select className="select select-bordered" value={selectedChef} onChange={e => setSelectedChef(e.target.value)}>
              <option value="">Chef de projet...</option>
              {chefs.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleAssignChef}>Affecter</button>
          </div>
        </div>
        {loading ? <div>Chargement...</div> : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Changer le rôle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-primary">{u.role}</span></td>
                  <td>
                    <select className="select select-bordered" value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                      <option value="ADMIN">Admin</option>
                      <option value="CHEF">Chef de projet</option>
                      <option value="MEMBRE">Membre</option>
                      <option value="USER">User</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Wrapper>
  );
} 