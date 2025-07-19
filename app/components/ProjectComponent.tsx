"use client"
import { Project } from '@/type'
import { ExternalLink, FolderGit2, Trash } from 'lucide-react';
import Link from 'next/link';
import React, { FC } from 'react'
import { toast } from 'react-toastify';
import { useState } from 'react';

interface ProjectProps {
    project: Project
    admin: number;
    style: boolean;
    onDelete?: (id: string) => void;

}

const ProjectComponent: FC<ProjectProps> = ({ project, admin, style, onDelete }) => {
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [saving, setSaving] = useState(false);

    if (project.chefDeProjet && project.chefDeProjet.email) {
      console.log(`Chef du projet ${project.name} : ${project.chefDeProjet.email}`);
    }

    const handleDeleteClick = () => {
        const isConfirmed = window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")
        if (isConfirmed && onDelete) {
            onDelete(project.id)
        }
    }

    const totalTasks = project.tasks?.length;
    const tasksByStatus = project.tasks?.reduce(
        (acc, task) => {
            if (task.status === "To Do") acc.toDo++;
            else if (task.status === "In Progress") acc.inProgress++;
            else if (task.status === "Done") acc.done++;
            return acc
        },
        {
            toDo: 0, inProgress: 0, done: 0
        }
    ) ?? { toDo: 0, inProgress: 0, done: 0 }

    const progressPercentage = totalTasks ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0
    const inProgressPercentage = totalTasks ? Math.round((tasksByStatus.inProgress / totalTasks) * 100) : 0
    const toDoPercentage = totalTasks ? Math.round((tasksByStatus.toDo / totalTasks) * 100) : 0

    const textSizeClass = style ? 'text-sm' : 'text-md'

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/project/${project.id}/edit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, chefId: project.chefDeProjet?.id })
            });
            if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
            toast.success('Projet mis à jour !');
            setEditMode(false);
        } catch (e) {
            toast.error('Erreur lors de la sauvegarde');
            console.log(e)
        } finally {
            setSaving(false);
        }
    };

    return (
        <div key={project.id} className={`${style ? 'border border-base-300 p-5 shadow-sm ' : ''}text-base-content rounded-xl w-full text-left`}>
            <div className='w-full flex items-center mb-3'>
                <div className='bg-primary-content text-xl h-10 w-10 rounded-lg flex justify-center items-center'>
                    <FolderGit2 className='w-6 text-primary' />
                </div>
                {editMode ? (
                  <input className='input input-bordered ml-3 font-bold' value={name} onChange={e => setName(e.target.value)} />
                ) : (
                  <div className='badge ml-3 font-bold'>{project.name}</div>
                )}
                {typeof project.totalCost !== 'undefined' && (
                  <span className='ml-4 badge badge-secondary'>Coût total : {project.totalCost} FCFA</span>
                )}
            </div>
            {/* Chef de projet visible sous le nom */}
            <div className='mb-2'>
              <span className='font-semibold'>Chef de projet :</span> <span className='ml-2'>{project.chefDeProjet?.name || '-'}</span>
            </div>
            {editMode ? (
              <textarea className='textarea textarea-bordered w-full mb-2' value={description} onChange={e => setDescription(e.target.value)} />
            ) : style == false && (
                <p className='text-sm text-gra-500 border  border-base-300 p-5 mb-6 rounded-xl'>
                    {project.description}
                </p>
            )}
            {/* Codes d'invitation affichés dans la carte */}
            {!project.chefDeProjet && (
              <div className="mb-2">
                <div className="flex gap-2 items-center mt-2">
                  <span className="badge badge-primary whitespace-nowrap px-3 py-1 min-w-[110px] text-center">Chef de projet</span>
                  <span className="select-all bg-base-200 px-2 py-1 rounded break-all max-w-[140px] text-center">{project.inviteCodeChef}</span>
                  <button className="btn btn-xs" onClick={() => navigator.clipboard.writeText(project.inviteCodeChef || '')}>Copier</button>
                </div>
                {admin === 1 && (
                  <div className="flex gap-2 items-center mt-2">
                    <span className="badge badge-secondary">Membre</span>
                    <span className="select-all bg-base-200 px-2 py-1 rounded">{project.inviteCodeMembre}</span>
                    <button className="btn btn-xs" onClick={() => navigator.clipboard.writeText(project.inviteCodeMembre || '')}>Copier</button>
                  </div>
                )}
              </div>
            )}
            <div className={`mb-3`}>
                <span>Collaborateurs</span>
                <div className='badge badge-sm badge-ghost ml-1'>{project.users?.length}</div>
            </div>
            {admin === 1 && (
              editMode ? (
                <div className='flex gap-2 mb-2'>
                  <button className='btn btn-primary btn-sm' onClick={handleSave} disabled={saving}>Sauvegarder</button>
                  <button className='btn btn-ghost btn-sm' onClick={() => setEditMode(false)}>Annuler</button>
                </div>
              ) : (
                <button className='btn btn-outline btn-sm mb-2' onClick={() => setEditMode(true)}>Modifier</button>
              )
            )}
            <div className='flex flex-col mb-3'>
                <h2 className={`text-gray-500 mb-2 ${textSizeClass}`}>
                    <span className='font-bold'>A faire</span>
                    <div className='badge badge-ghost badge-sm ml-1'>
                        {tasksByStatus.toDo}
                    </div>
                </h2>
                <progress className="progress progress-primary w-full" value={toDoPercentage} max="100"></progress>
                <div className='flex'>
                    <span className={`text-gray-400 mt-2 ${textSizeClass}`}>{toDoPercentage}%</span>
                </div>
            </div>
            <div className='flex flex-col mb-3'>
                <h2 className={`text-gray-500 mb-2 ${textSizeClass}`}>
                    <span className='font-bold'>En cours</span>
                    <div className='badge badge-ghost badge-sm ml-1'>{tasksByStatus.inProgress}</div>
                </h2>
                <progress className="progress progress-primary w-full" value={inProgressPercentage} max="100"></progress>
                <div className='flex'>
                    <span className={`text-gray-400 mt-2 ${textSizeClass}`}>{inProgressPercentage}%</span>
                </div>
            </div>
            <div className='flex flex-col mb-3'>
                <h2 className={`text-gray-500 mb-2 ${textSizeClass}`}>
                    <span className='font-bold'>Terminée(s)</span>
                    <div className='badge badge-ghost badge-sm ml-1 '>{tasksByStatus.done}</div>
                </h2>
                <progress className="progress progress-primary w-full" value={progressPercentage} max="100"></progress>
                <div className='flex'>
                    <span className={`text-gray-400 mt-2 ${textSizeClass}`}>{progressPercentage}%</span>
                </div>
            </div>
            <div className='flex'>
                {style && (
                    <Link className='btn btn-primary btn-sm' href={`/project/${project.id}`}>
                        <div className='badge badge-sm'>{totalTasks}</div>
                        Tâche
                        <ExternalLink className='w-4' />
                    </Link>
                )}
                {admin === 1 && (
                    <button className='btn btn-sm ml-3' onClick={handleDeleteClick}>
                        <Trash className='w-4' />
                    </button>
                )}
            </div>
        </div>
    );
}

export default ProjectComponent;