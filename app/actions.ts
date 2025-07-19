"use server"

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Project} from '@/type';

// Type definitions for Prisma includes
type ProjectWithOptionalFields = Project & {
  inviteCodeChef?: string | null;
  inviteCodeMembre?: string | null;
};

type ProjectUserEntry = {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
};

export async function checkAndAddUser(email: string, name: string) {
    try {
        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name
                }
            });
        }

        return user;
    } catch (error) {
        console.error(error)
        throw new Error
    }
}

function generateUniqueCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createProject(name: string, description: string, email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            throw new Error(`Utilisateur avec l'email ${email} introuvable`);
        }
        const inviteCode = generateUniqueCode();
        const inviteCodeChef = generateUniqueCode();
        const inviteCodeMembre = generateUniqueCode();
        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                inviteCode,
                inviteCodeChef,
                inviteCodeMembre,
                createdById: user.id
            } as {
                name: string;
                description: string;
                inviteCode: string;
                inviteCodeChef: string;
                inviteCodeMembre: string;
                createdById: string;
            }
        });
        return { ...newProject, inviteCodeChef, inviteCodeMembre };
    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export async function getProjectsCreatedByUser(email: string) {
    try {

        const projects = await prisma.project.findMany({
            where: {
                createdBy: { email }
            },
            include: {
                tasks: {
                    include: {
                        user: true,
                        createdBy: true
                    }
                },
                users: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                 role: true, 
                            }
                        }
                    }
                }
            }
        })

        const formattedProjects = projects.map((project) => ({
            ...project,
            users: project.users.map((userEntry) => userEntry.user)
        }))

        return formattedProjects

    } catch (error) {
        console.error(error)
        throw new Error
    }
}


export async function deleteProjectById(projectId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error('Non authentifié');
    const role = await getUserRole(userId);
    if (role !== 'ADMIN') throw new Error('Permission refusée : admin uniquement');
    try {
        // Supprimer d'abord les ressources liées
        await prisma.resource.deleteMany({ where: { projectId } });
        // Supprimer les coûts liés
        await prisma.cost.deleteMany({ where: { projectId } });
        // Supprimer les associations ProjectUser
        await prisma.projectUser.deleteMany({ where: { projectId } });
        // Supprimer le projet (les tâches sont supprimées en cascade)
        await prisma.project.delete({
            where: {
                id: projectId
            }
        })
        console.log(`Projet avec l'ID ${projectId} supprimé avec succès.`);
    } catch (error) {
        console.error(error)
        throw new Error('Erreur lors de la suppression du projet.');
    }
}

export async function addUserToProject(email: string, inviteCode: string) {
    try {
        // Recherche du projet par les trois codes possibles
        const project = await prisma.project.findFirst({
            where: {
                OR: [
                    { inviteCode: inviteCode },
                    { inviteCodeChef: inviteCode },
                    { inviteCodeMembre: inviteCode }
                ]
            }
        });
        if (!project) {
            console.error('Projet non trouvé pour le code', inviteCode);
            throw new Error('Projet non trouvé');
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            console.error('Utilisateur non trouvé pour l\'email', email);
            throw new Error('Utilisateur non trouvé');
        }
        const existingAssociation = await prisma.projectUser.findUnique({
            where: {
                userId_projectId: {
                    userId: user.id,
                    projectId: project.id
                }
            }
        });
        if (existingAssociation) {
            console.error('Utilisateur déjà associé à ce projet', user.id, project.id);
            throw new Error('Utilisateur déjà associé à ce projet');
        }
        // Détermine le rôle à assigner
        let newRole = user.role;
        let isChef = false;
        // On utilise le type ProjectWithOptionalFields pour les champs optionnels
        const projectWithOptionalFields = project as ProjectWithOptionalFields;
        if (projectWithOptionalFields.inviteCodeChef && inviteCode === projectWithOptionalFields.inviteCodeChef) {
            newRole = 'CHEF';
            isChef = true;
        } else if (projectWithOptionalFields.inviteCodeMembre && inviteCode === projectWithOptionalFields.inviteCodeMembre) {
            newRole = 'MEMBRE';
        }
        // Met à jour le rôle si besoin
        if (newRole !== user.role) {
            await prisma.user.update({ where: { id: user.id }, data: { role: newRole } });
        }
        await prisma.projectUser.create({
            data: {
                userId: user.id,
                projectId: project.id
            }
        });
        // Si c'est le code chef, on met à jour le champ chefDeProjetId du projet
        if (isChef) {
            await prisma.project.update({ 
                where: { id: project.id }, 
                data: { chefDeProjetId: user.id } 
            });
        }
        return 'Utilisateur ajouté au projet avec succès';
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout au projet';
        console.error('Erreur addUserToProject:', errorMessage);
        throw new Error(errorMessage);
    }
}

export async function getProjectsAssociatedWithUser(email: string) {
    try {

        const projects = await prisma.project.findMany({
            where: {
                users: {
                    some: {
                        user: {
                            email
                        }
                    }
                }
            },
            include: {
                tasks: true,
                users: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            }
                        }
                    }
                }
            }

        })

        const formattedProjects = projects.map((project) => ({
            ...project,
            users: project.users.map((userEntry) => userEntry.user)
        }))

        return formattedProjects

    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export async function getProjectInfo(idProject: string, details: boolean) {
    try {
        const project = await prisma.project.findUnique({
            where: {
                id: idProject
            },
            include: details ? {
                tasks: {
                    include: {
                        user: true,
                        createdBy: true
                    }
                },
                users: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            }
                        }
                    }
                },
                createdBy: true
            } : undefined,
        })

        if (!project) {
            throw new Error('Projet non trouvé');
        }

        return project
    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export async function getProjectUsers(idProject: string) {
    try {
        const projectWithUsers = await prisma.project.findUnique({
            where: {
                id: idProject
            },
            include: {
                users: {
                    include: {
                        user: true,
                    }
                },
            }

        })

        const users = projectWithUsers?.users.map((projectUser => projectUser.user)) || []
        return users

    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export async function createTask(
    name: string,
    description: string,
    dueDate: Date | null,
    projectId: string,
    createdByEmail: string,
    assignToEmail: string | undefined
) {
    try {
        const createdBy = await prisma.user.findUnique({ where: { email: createdByEmail } })
        if (!createdBy) {
            throw new Error(`Utilisateur avec l'email ${createdByEmail} introuvable`);
        }
        // Récupère le projet
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { users: { include: { user: true } } }
        });
        if (!project) throw new Error('Projet non trouvé');
        // Vérifier que le créateur est le chef de projet OU un admin
        const userRole = createdBy.role;
        if (project.chefDeProjetId !== createdBy.id && userRole !== 'ADMIN') {
            throw new Error('Seul le chef de projet ou un admin peut créer des tâches');
        }
        // Vérifier que l'utilisateur assigné est membre du projet
        let assignedUserId = createdBy.id
        if (assignToEmail) {
            const assignedUser = await prisma.user.findUnique({ where: { email: assignToEmail } })
            if (!assignedUser) {
                throw new Error(`Utilisateur avec l'email ${assignToEmail} introuvable`);
            }
            const isMember = project.users.some((pu: ProjectUserEntry) => pu.user.email === assignToEmail)
            if (!isMember) {
                throw new Error('L\'utilisateur assigné doit être membre du projet');
            }
            assignedUserId = assignedUser.id
        }
        const newTask = await prisma.task.create({
            data: {
                name,
                description,
                dueDate,
                projectId,
                createdById: createdBy.id,
                userId: assignedUserId
            }
        })
        console.log('Tâche créée avec succès:', newTask);
        return newTask;
    } catch (error) {
        console.error(error)
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage)
    }
}
export async function deleteTaskById(taskId: string) {
    try {
        await prisma.task.delete({
            where: {
                id: taskId
            }
        })
    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export const getTaskDetails = async (taskId: string) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: true,
                user: true,
                createdBy: true
            }
        })
        if (!task) {
            throw new Error('Tâche non trouvée');
        }

        return task

    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export const updateTaskStatus = async (taskId: string, newStatus: string, solutionDescription?: string) => {
    try {

        const existingTask = await prisma.task.findUnique({
            where: {
                id: taskId
            }
        })

        if (!existingTask) {
            throw new Error('Tâche non trouvée');
        }

        if (newStatus === "Done" && solutionDescription) {
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: newStatus,
                    solutionDescription
                }
            })
        } else {
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: newStatus
                }
            })
        }
    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export async function getProjectResources(projectId: string) {
  try {
    const resources = await prisma.resource.findMany({ where: { projectId } });
    return resources;
  } catch (error) {
    console.error(error);
    throw new Error('Erreur lors de la récupération des ressources du projet');
  }
}

export async function getTaskResources(taskId: string) {
  try {
    const taskResources = await prisma.taskResource.findMany({
      where: { taskId },
      include: { resource: true }
    });
    return taskResources;
  } catch (error) {
    console.error(error);
    throw new Error('Erreur lors de la récupération des ressources de la tâche');
  }
}

export async function getProjectCosts(projectId: string) {
  try {
    const costs = await prisma.cost.findMany({ where: { projectId } });
    return costs;
  } catch (error) {
    console.error(error);
    throw new Error('Erreur lors de la récupération des coûts du projet');
  }
}

export async function getProjectsWithTotalCost(email: string): Promise<(Project & { totalCost: number })[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { createdBy: { email } },
      include: {
        costs: true,
        tasks: {
          include: { user: true, createdBy: true }
        },
        users: {
          select: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        chefDeProjet: true
      }
    });
    const formattedProjects = projects.map((project) => {
      const totalCost = (project.costs || []).reduce((sum: number, c: { spent: number }) => sum + (c.spent || 0), 0);
      return {
        ...project,
        users: project.users.map((userEntry: { user: { id: string; name: string; email: string; role: string } }) => userEntry.user),
        totalCost
      };
    });
    return formattedProjects as unknown as (Project & { totalCost: number })[];
  } catch (error) {
    console.error(error);
    throw new Error;
  }
}

export async function getUserRole(userIdOrEmail: string) {
  let user = await prisma.user.findUnique({ where: { id: userIdOrEmail } });
  if (!user && userIdOrEmail.includes('@')) {
    user = await prisma.user.findUnique({ where: { email: userIdOrEmail } });
  }
  console.log('getUserRole:', userIdOrEmail, user?.role);
  return user?.role || 'USER';
}

export async function isAdmin(userId: string) {
  return (await getUserRole(userId)) === 'ADMIN';
}
export async function isChef(userId: string) {
  return (await getUserRole(userId)) === 'CHEF';
}
export async function isMembre(userId: string) {
  return (await getUserRole(userId)) === 'MEMBRE';
}

export async function assignChefDeProjetToProject(projectId: string, chefId: string, adminId: string) {
  const adminRole = await getUserRole(adminId);
  if (adminRole !== 'ADMIN') throw new Error('Permission refusée : admin uniquement');
  const chef = await prisma.user.findUnique({ where: { id: chefId } });
  if (!chef || chef.role !== 'CHEF') throw new Error('L\'utilisateur sélectionné n\'est pas un chef de projet');
  await prisma.project.update({ where: { id: projectId }, data: { chefDeProjetId: chefId } });
  return true;
}


