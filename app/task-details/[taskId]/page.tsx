"use client"
import { getProjectInfo, getTaskDetails, updateTaskStatus } from '@/app/actions';
import EmptyState from '@/app/components/EmptyState';
import UserInfo from '@/app/components/UserInfo';
import Wrapper from '@/app/components/Wrapper';
import { Project, Task } from '@/type';
import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react'
import ReactQuill from 'react-quill-new';
import { toast } from 'react-toastify';
import 'react-quill-new/dist/quill.snow.css';
import { useUser } from '@clerk/nextjs';
import ResourceList from '@/app/components/ResourceList';
import { getTaskResources } from '@/app/actions';

// Type pour TaskResource avec la relation resource incluse
type TaskResourceWithResource = {
  id: string;
  taskId: string;
  resourceId: string;
  quantity: number | null;
  resource: {
    type: string;
    id: string;
    name: string;
    projectId: string | null;
    cost: number;
  };
};

const Page = ({ params }: { params: Promise<{ taskId: string }> }) => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const [task, setTask] = useState<Task | null>(null)
  const [taskId, setTaskId] = useState<string>("")
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState("");
  const [realStatus, setRealStatus] = useState("");
  const [solution, setSolution] = useState("");
  const [taskResources, setTaskResources] = useState<TaskResourceWithResource[]>([]);
  const [allResources, setAllResources] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'font': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  };

  const fetchInfos = useCallback(async (taskId: string) => {
    try {
      const task = await getTaskDetails(taskId)
      setTask(task)
      setStatus(task.status)
      setRealStatus(task.status)
      fetchProject(task.projectId)
      // Ajout récupération ressources assignées
      const tr = await getTaskResources(taskId);
      setTaskResources(tr);
      // Récupère toutes les ressources globales pour l'assignation
      const res = await fetch('/api/resource');
      const all = await res.json();
      setAllResources(all);
    } catch {
      toast.error("Erreur lors du chargement des détails de la tâche.");
    }
  }, [])

  const fetchProject = async (projectId: string) => {
    try {
      const project = await getProjectInfo(projectId, false)
      setProject(project as Project)
    } catch {
      toast.error("Erreur lors du chargement du projet");
    }
  }

  useEffect(() => {
    const getId = async () => {
      const resolvedParams = await params;
      setTaskId(resolvedParams.taskId)
      fetchInfos(resolvedParams.taskId)
    }
    getId()
  }, [params, fetchInfos])

  const changeStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateTaskStatus(taskId, newStatus)
      fetchInfos(taskId)
    } catch {
      toast.error("Erreur lors du changement de status")
    }
  }

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value;
    setStatus(newStatus)
    const modal = document.getElementById('my_modal_3') as HTMLDialogElement
    if (newStatus == "To Do" || newStatus == "In Progress") {
      changeStatus(taskId, newStatus)
      toast.success('Status changé')
      modal.close()
    } else {
      modal.showModal()
    }
  }

  const closeTask = async (newStatus: string) => {
    const modal = document.getElementById('my_modal_3') as HTMLDialogElement
    try {
      if (solution != "") {
        await updateTaskStatus(taskId, newStatus, solution)
        fetchInfos(taskId)
        if (modal) {
          modal.close()
        }
        toast.success('Tache cloturée')
      } else {
        toast.error('Il manque une solution')
      }

    } catch {
      toast.error("Erreur lors du changement de status")
    }
  }

  useEffect(() => {
    const modal = document.getElementById('my_modal_3') as HTMLDialogElement
    const handleClose = () => {
      if (status === "Done" && status !== realStatus) {
        setStatus(realStatus)
      }
    }
    if (modal) {
      modal.addEventListener('close', handleClose)
    }
    return () => {
      if (modal) {
        modal.removeEventListener('close', handleClose)
      }
    }

  }, [status, realStatus])

  return (
    <Wrapper>
      {task ? (
        <div>
          <div className='flex flex-col md:justify-between md:flex-row'>
            <div className='breadcrumbs text-sm'>
              <ul>
                <li><Link href={`/project/${task?.projectId}`}>Retour</Link></li>
                <li>{project?.name}</li>
              </ul>
            </div>
            <div className='p-5 border border-base-300 rounded-xl w-full md:w-fit my-4'>
              <UserInfo
                role="Asigné à"
                email={task.user?.email || null}
                name={task.user?.name || null}
              />
            </div>
          </div>

          <h1 className='font-semibold italic text-2xl mb-4'>{task.name}</h1>

          {/* Affichage des ressources assignées */}
          <div className='mb-4'>
            <div className='flex items-center justify-between'>
              <span className='font-bold'>Ressources assignées</span>
              <button className='btn btn-sm btn-primary' onClick={() => setShowAssignModal(true)}>
                Assigner une ressource
              </button>
            </div>
            <ResourceList
              resources={taskResources.map(tr => ({...tr.resource, cost: tr.resource?.cost || 0}))}
              showQuantity={true}
              quantities={Object.fromEntries(taskResources.map(tr => [tr.resourceId, tr.quantity]))}
              onDelete={async (resourceId) => {
                // Trouver l'id du TaskResource à supprimer
                const tr = taskResources.find(tr => tr.resourceId === resourceId);
                if (!tr) return;
                try {
                  await fetch(`/api/resource/assign/${tr.id}`, { method: 'DELETE' });
                  fetchInfos(taskId);
                  toast.success('Ressource supprimée !');
                } catch {
                  toast.error('Erreur lors de la suppression');
                }
              }}
            />
          </div>

          {/* Modal d'assignation */}
          {showAssignModal && (
            <dialog open className="modal">
              <div className="modal-box">
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => setShowAssignModal(false)}>✕</button>
                </form>
                <h3 className="font-bold text-lg mb-3">Assigner une ressource</h3>
                <div className="mb-2">
                  <select className="select select-bordered w-full" value={selectedResource || ''} onChange={e => setSelectedResource(e.target.value)}>
                    <option value="">Choisir une ressource</option>
                    {allResources.map((r: { id: string; name: string; type: string }) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <input type="number" min={1} className="input input-bordered w-full" placeholder="Quantité ou heures" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                </div>
                <button className="btn btn-primary w-full" onClick={async () => {
                  if (!selectedResource) return;
                  try {
                    await fetch('/api/resource/assign', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ taskId, resourceId: selectedResource, quantity })
                    });
                    setShowAssignModal(false);
                    fetchInfos(taskId);
                    toast.success('Ressource assignée !');
                  } catch {
                    toast.error('Erreur lors de l&apos;assignation');
                  }
                }}>
                  Assigner
                </button>
              </div>
            </dialog>
          )}

          <div className='flex justify-between items-center mb-4'>
            <span>
              A livré le
              <div className='badge badge-ghost ml-2'> {task?.dueDate?.toLocaleDateString()}</div>
            </span>
            <div>
              <select
                value={status}
                onChange={handleStatusChange}
                className='select select-sm select-bordered select-primary focus:outline-none ml-3'
                disabled={status == "Done" || task.user?.email !== email}
              >
                <option value="To Do">A faire</option>
                <option value="In Progress">En cours</option>
                <option value="Done">Terminée</option>
              </select>
            </div>
          </div>

          <div>
            <div className='flex md:justify-between md:items-center flex-col md:flex-row'>
              <div className='p-5 border border-base-300 rounded-xl w-full md:w-fit md:mb-4 '>
                <UserInfo
                  role="Créer par"
                  email={task.createdBy?.email || null}
                  name={task.createdBy?.name || null}
                />
              </div>
              <div className='badge badge-primary my-4 md:mt-0'>
                {task.dueDate && `
                    ${Math.max(0, Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} jours restants
               `}
              </div>
            </div>
          </div>

          <div className='ql-snow w-full'>
            <div
              className='ql-editor p-5 border-base-300 border rounded-xl'
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          </div>

          {task?.solutionDescription && (
            <div>
              <div className='badge badge-primary my-4'>
                Solution
              </div>

              <div className='ql-snow w-full'>
                <div
                  className='ql-editor p-5 border-base-300 border rounded-xl'
                  dangerouslySetInnerHTML={{ __html: task.solutionDescription }}
                />
              </div>
            </div>
          )}


          <dialog id="my_modal_3" className="modal">
            <div className="modal-box">
              <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
              </form>
              <h3 className="font-bold text-lg">C&apos;est quoi la solutions ?</h3>
              <p className="py-4">Décrivez ce que vous avez fait exactement</p>

              <ReactQuill
                placeholder='Decrivez la solution'
                value={solution}
                modules={modules}
                onChange={setSolution}
              />
              <button onClick={() => closeTask(status)} className='btn mt-4'> Terminé(e)</button>
            </div>
          </dialog>

        </div>
      ) : (
        <EmptyState
          imageSrc="/empty-task.png"
          imageAlt="Picture of an empty project"
          message="Cette tâche n'existe pas"
        />
      )}
    </Wrapper>
  )
}

export default Page