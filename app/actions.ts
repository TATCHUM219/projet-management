"use server"

import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { auth } from "@clerk/nextjs/server"
import { Project } from '@/type';

export async function isAdmin() {
  const { userId } =await auth()
  if (!userId) return false

  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user?.role === "ADMIN"
}

export async function checkAndAddUser(email: string, name: string) {
    if (!email) return
    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        })
        if (!existingUser && name) {
            await prisma.user.create({
                data: {
                    email,
                    name
                }
            })
            console.error("Erreur lors de la vérification de l'utilisateur:");
        } else {
            console.error("Utilisateur déjà présent dans la base de données");
        }
    } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur:", error);
    }
}

function generateUniqueCode(): string {
    return randomBytes(6).toString('hex')
}

export async function createProject(name: string, description: string, email: string) {
    try {

        const inviteCode = generateUniqueCode()
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })
        if (!user) {
            throw new Error('User not found');
        }

        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                inviteCode,
                createdById: user.id
            }
        })
        return newProject;
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
    try {
        await prisma.project.delete({
            where: {
                id: projectId
            }
        })
        console.log(`Projet avec l'ID ${projectId} supprimé avec succès.`);
    } catch (error) {
        console.error(error)
        throw new Error
    }
}

export async function addUserToProject(email: string, inviteCode: string) {
    try {

        const project = await prisma.project.findUnique({
            where: { inviteCode }
        })

        if (!project) {
            throw new Error('Projet non trouvé');
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        const existingAssociation = await prisma.projectUser.findUnique({
            where: {
                userId_projectId: {
                    userId: user.id,
                    projectId: project.id
                }
            }
        })

        if (existingAssociation) {
            throw new Error('Utilisateur déjà associé à ce projet');
        }

        await prisma.projectUser.create({
            data: {
                userId: user.id,
                projectId: project.id
            }
        })
        return 'Utilisateur ajouté au projet avec succès';
    } catch (error) {
        console.error(error)
        throw new Error
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
        const createdBy = await prisma.user.findUnique({
            where: { email: createdByEmail }
        })

        if (!createdBy) {
            throw new Error(`Utilisateur avec l'email ${createdByEmail} introuvable`);
        }

        let assignedUserId = createdBy.id

        if (assignToEmail) {
            const assignedUser = await prisma.user.findUnique({
                where: { email: assignToEmail }
            })
            if (!assignedUser) {
                throw new Error(`Utilisateur avec l'email ${assignToEmail} introuvable`);
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
        throw new Error
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
        }
      }
    });
    const formattedProjects = projects.map((project: any) => {
      const totalCost = (project.costs || []).reduce((sum: number, c: any) => sum + (c.spent || 0), 0);
      return {
        ...project,
        users: project.users.map((userEntry: any) => userEntry.user),
        totalCost
      };
    });
    return formattedProjects;
  } catch (error) {
    console.error(error);
    throw new Error;
  }
}


