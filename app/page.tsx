"use client"

import Wrapper from "./components/Wrapper";
import { useEffect, useState } from "react";
import { FolderGit2 } from "lucide-react";
import { createProject, deleteProjectById, getProjectsWithTotalCost } from "./actions";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { Project } from "@/type";
import ProjectComponent from "./components/ProjectComponent";
import EmptyState from "./components/EmptyState";


export default function Home() {

  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress as string
  const [name, setName] = useState("")
  const [descrition, setDescription] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [role, setRole] = useState<string | null>(null);
  const [lastCodes, setLastCodes] = useState<{chef?: string, membre?: string} | null>(null);

  const fetchProjects = async (email: string) => {
    try {
      const myproject = await getProjectsWithTotalCost(email)
      setProjects(myproject)
      myproject.forEach((p: Project) => {
        console.log(`Chef du projet ${p.name} : ${p.chefDeProjet?.email || '-'}`);
      });
      // console.log(myproject)
    } catch {
      console.error('Erreur lors du chargement des projets');
    }
  }

  useEffect(() => {
    if (user && user.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress;
      fetchProjects(email);
      fetch(`/api/user/${email}`)
        .then(res => res.json())
        .then(data => {
          setRole(data.role || null);
          console.log('Rôle utilisateur connecté:', data.role);
        });
    }
  }, [user]);

  const deleteProject = async (projectId: string) => {
    try {
      await deleteProjectById(projectId)
      setProjects(projects.filter(p => p.id !== projectId))
      toast.success('Project supprimé !')
    } catch {
      toast.error('Erreur lors de la suppression du projet.');
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !descrition.trim()) {
      toast.error('Veuillez remplir tous les champs du projet');
      return;
    }
    try {
      const modal = document.getElementById('my_modal_3') as HTMLDialogElement
      const project = await createProject(name, descrition, email)
      if (modal) {
        modal.close()
      }
      setName("");
      setDescription("");
      // Ajoute le projet sans rechargement
      setProjects([project as Project, ...projects])
      setLastCodes({ chef: project.inviteCodeChef, membre: project.inviteCodeMembre });
      toast.success("Projet Créé")
    } catch {
      console.error('Error creating project');
    }
  }

  return (
    <Wrapper>
      <div>
        {/* Onglet/bouton pour accéder à la page des ressources */}
        {role =='ADMIN' && (
          <a href="/resources" className="btn btn-secondary mb-4">Gérer les ressources</a>
        )}
        {/* Bouton de création de projet visible uniquement pour admin */}
        {role == 'ADMIN' && (
          <button className="btn  btn-primary mb-6" onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}>
            Nouveau Projet <FolderGit2 />
          </button>
        )}

        <dialog id="my_modal_3" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            
            <h3 className="font-bold text-lg">Nouveau Projet</h3>
            <p className="py-4">Décrivez votre projet simplement grâce à la description </p>
            <div>
              <input
                placeholder="Nom du projet"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-base-300 input  input-bordered w-full mb-4 placeholder:text-sm"
                required
              />
              <textarea
                placeholder="Description"
                value={descrition}
                onChange={(e) => setDescription(e.target.value)}
                className="mb-2 textarea textarea-bordered border border-base-300 w-full  textarea-md placeholder::text-sm"
                required
              >
              </textarea>
            {role=="ADMIN"}&&(  <button className="btn btn-primary" onClick={handleSubmit}>
                Nouveau Projet <FolderGit2 />
              </button>)
            </div>
          </div>
        </dialog>

        <div className="w-full">
          {lastCodes && (
            <div className="mb-4">
              <div className="font-bold">Codes d&apos;invitation :</div>
              <div className="flex gap-2 items-center mt-2">
                <span className="badge badge-primary">Chef de projet</span>
                <span className="select-all bg-base-200 px-2 py-1 rounded">{lastCodes.chef}</span>
                <button className="btn btn-xs" onClick={() => navigator.clipboard.writeText(lastCodes.chef || '')}>Copier</button>
              </div>
              {role === 'ADMIN' && (
                <div className="flex gap-2 items-center mt-2">
                  <span className="badge badge-secondary">Membre</span>
                  <span className="select-all bg-base-200 px-2 py-1 rounded">{lastCodes.membre}</span>
                  <button className="btn btn-xs" onClick={() => navigator.clipboard.writeText(lastCodes.membre || '')}>Copier</button>
                </div>
              )}
            </div>
          )}

          {projects.length > 0 ? (
            <ul className="w-full grid md:grid-cols-3 gap-6">
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectComponent project={project} admin={role === 'ADMIN' ? 1 : 0} style={true} onDelete={deleteProject} />
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <EmptyState
                 imageSrc='/empty-project.png'
                 imageAlt="Picture of an empty project"
                 message="Aucun projet Créer"
              />
            </div>
          )}

        </div>

      </div>
    </Wrapper>
  );
}
