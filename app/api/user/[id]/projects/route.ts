import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    let user;
    if (id.includes('@')) {
      // Recherche par email
      user = await prisma.user.findUnique({
        where: { email: id },
        include: {
          userProjects: {
            include: {
              project: true
            }
          },
          projetsChef: true
        }
      });
    } else {
      // Recherche par id
      user = await prisma.user.findUnique({
        where: { id },
        include: {
          userProjects: {
            include: {
              project: true
            }
          },
          projetsChef: true
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Combiner les projets où l'utilisateur est membre et ceux où il est chef
    const memberProjects = user.userProjects.map(up => up.project);
    const chefProjects = user.projetsChef;
    
    // Éliminer les doublons (un utilisateur peut être à la fois membre et chef)
    const allProjects = [...memberProjects, ...chefProjects];
    const uniqueProjects = allProjects.filter((project, index, self) => 
      index === self.findIndex(p => p.id === project.id)
    );

    return NextResponse.json({ projects: uniqueProjects });
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
} 