"use client";
import { useEffect, useState } from "react";
import ResourceList from "../components/ResourceList";
import { Resource } from "@/type";
import Wrapper from "../components/Wrapper";
import { toast } from "react-toastify";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("HUMAN");
  const [cost, setCost] = useState("");

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resource");
      const data = await res.json();
      setResources(data);
    } catch {
      toast.error("Erreur lors du chargement des ressources");
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const openModal = (resource?: Resource) => {
    if (resource) {
      setEditId(resource.id);
      setName(resource.name);
      setType(resource.type);
      setCost(resource.cost.toString());
    } else {
      setEditId(null);
      setName("");
      setType("HUMAN");
      setCost("");
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await fetch(`/api/resource/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type, cost: parseFloat(cost) }),
        });
        toast.success("Ressource modifiée !");
      } else {
        await fetch("/api/resource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type, cost: parseFloat(cost) }),
        });
        toast.success("Ressource créée !");
      }
      setShowModal(false);
      fetchResources();
    } catch {
      toast.error("Erreur lors de l'enregistrement de la ressource");
    }
  };

  const handleDelete = async (resourceId: string) => {
    try {
      await fetch(`/api/resource/${resourceId}`, { method: "DELETE" });
      fetchResources();
      toast.success("Ressource supprimée !");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <Wrapper>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion des ressources</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>Nouvelle ressource</button>
      </div>
      <ResourceList
        resources={resources}
        onDelete={handleDelete}
        // showProject={true} // décommente si tu veux afficher l'id projet
      />
      {showModal && (
        <dialog open className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setShowModal(false)}>✕</button>
            </form>
            <h3 className="font-bold text-lg mb-3">{editId ? "Modifier" : "Nouvelle"} ressource</h3>
            <input
              className="input input-bordered w-full mb-2"
              placeholder="Nom de la ressource"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <select className="select select-bordered w-full mb-2" value={type} onChange={e => setType(e.target.value)}>
              <option value="HUMAN">Humaine</option>
              <option value="MATERIAL">Matérielle</option>
            </select>
            <input
              className="input input-bordered w-full mb-2"
              placeholder="Coût (FCFA/h ou unité)"
              type="number"
              min={0}
              value={cost}
              onChange={e => setCost(e.target.value)}
            />
            <button className="btn btn-primary w-full" onClick={handleSubmit}>{editId ? "Modifier" : "Créer"}</button>
          </div>
        </dialog>
      )}
      <div className="mt-4 text-sm text-gray-500">Cliquez sur une ressource pour la modifier.</div>
      <ul>
        {resources.map((r) => (
          <li key={r.id} className="cursor-pointer" onClick={() => openModal(r)}></li>
        ))}
      </ul>
    </Wrapper>
  );
} 