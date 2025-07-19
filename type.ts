import { Project as PrismaProject, Task  as  PrismaTask, User } from '@prisma/client';

// Fusion du type PrismaProject avec vos propriétés supplémentaires
export type Resource = {
  id: string;
  name: string;
  type: string;
  cost: number;
  projectId?: string;
};

export type TaskResource = {
  id: string;
  taskId: string;
  resourceId: string;
  quantity?: number;
  resource?: Resource;
};

export type Cost = {
  id: string;
  projectId: string;
  budget: number;
  spent: number;
  updatedAt: string;
};

export type Project = PrismaProject & {
  totalTasks?: number;
  collaboratorsCount?: number;
  taskStats?: {
    toDo: number;
    inProgress: number;
    done: number;
  };
  percentages?: {
    progressPercentage: number;
    inProgressPercentage: number;
    toDoPercentage: number;
  };
  tasks?: Task[];
  users?: User[];
  createdBy?: User;
  resources?: Resource[];
  costs?: Cost[];
  chefDeProjetId?: string;
  chefDeProjet?: User;
  totalCost?: number;
};

export type Task = PrismaTask & {
  user?: User | null;
  createdBy?: User | null;
  taskResources?: TaskResource[];
};
