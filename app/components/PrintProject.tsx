"use client"

import { Project, Resource, Cost } from '@/type';
import { Printer } from 'lucide-react';
import React from 'react';

interface PrintProjectProps {
    project: Project;
    resources: Resource[];
    costs: Cost[];
}

const PrintProject: React.FC<PrintProjectProps> = ({ project, resources, costs }) => {
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const totalTasks = project.tasks?.length || 0;
        const tasksByStatus = project.tasks?.reduce(
            (acc, task) => {
                if (task.status === "To Do") acc.toDo++;
                else if (task.status === "In Progress") acc.inProgress++;
                else if (task.status === "Done") acc.done++;
                return acc;
            },
            { toDo: 0, inProgress: 0, done: 0 }
        ) ?? { toDo: 0, inProgress: 0, done: 0 };

        const progressPercentage = totalTasks ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0;
        const totalCost = costs.reduce((sum, cost) => sum + cost.spent, 0);

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fiche Projet - ${project.name}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        line-height: 1.6;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .project-info {
                        margin-bottom: 30px;
                    }
                    .section {
                        margin-bottom: 25px;
                        page-break-inside: avoid;
                    }
                    .section h2 {
                        color: #333;
                        border-bottom: 1px solid #ccc;
                        padding-bottom: 5px;
                        margin-bottom: 15px;
                    }
                    .info-row {
                        display: flex;
                        margin-bottom: 10px;
                    }
                    .info-label {
                        font-weight: bold;
                        width: 150px;
                        min-width: 150px;
                    }
                    .progress-bar {
                        width: 100%;
                        height: 20px;
                        background-color: #f0f0f0;
                        border-radius: 10px;
                        overflow: hidden;
                        margin: 5px 0;
                    }
                    .progress-fill {
                        height: 100%;
                        background-color: #007bff;
                        transition: width 0.3s ease;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .stat-card {
                        border: 1px solid #ddd;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .stat-number {
                        font-size: 24px;
                        font-weight: bold;
                        color: #007bff;
                    }
                    .tasks-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    .tasks-table th,
                    .tasks-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    .tasks-table th {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    .resources-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    .resources-table th,
                    .resources-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    .resources-table th {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    .costs-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    .costs-table th,
                    .costs-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    .costs-table th {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #ccc;
                        padding-top: 20px;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Fiche Projet</h1>
                    <h2>${project.name}</h2>
                    <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                </div>

                <div class="project-info">
                    <div class="info-row">
                        <span class="info-label">Nom du projet:</span>
                        <span>${project.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Description:</span>
                        <span>${project.description || 'Aucune description'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Créé par:</span>
                        <span>${project.createdBy?.name || project.createdBy?.email || 'Non spécifié'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Chef de projet:</span>
                        <span>${project.chefDeProjet?.name || project.chefDeProjet?.email || 'Non assigné'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date de création:</span>
                        <span>${new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>

                <div class="section">
                    <h2>Statistiques du projet</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${totalTasks}</div>
                            <div>Total des tâches</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${project.users?.length || 0}</div>
                            <div>Collaborateurs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${totalCost.toLocaleString()} FCFA</div>
                            <div>Coût total</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Progression des tâches</h2>
                    <div class="info-row">
                        <span class="info-label">À faire:</span>
                        <span>${tasksByStatus.toDo} tâches</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${totalTasks ? (tasksByStatus.toDo / totalTasks) * 100 : 0}%"></div>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">En cours:</span>
                        <span>${tasksByStatus.inProgress} tâches</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${totalTasks ? (tasksByStatus.inProgress / totalTasks) * 100 : 0}%"></div>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Terminées:</span>
                        <span>${tasksByStatus.done} tâches (${progressPercentage}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>

                <div class="section">
                    <h2>Liste des tâches</h2>
                    ${project.tasks && project.tasks.length > 0 ? `
                        <table class="tasks-table">
                            <thead>
                                <tr>
                                    <th>Titre</th>
                                    <th>Statut</th>
                                    <th>Assigné à</th>
                                    <th>Date de livraison</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${project.tasks.map(task => `
                                    <tr>
                                        <td>${task.name}</td>
                                        <td>${task.status}</td>
                                        <td>${task.user?.name || task.user?.email || 'Non assigné'}</td>
                                        <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Aucune tâche dans ce projet.</p>'}
                </div>

                ${resources.length > 0 ? `
                    <div class="section">
                        <h2>Ressources</h2>
                        <table class="resources-table">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Type</th>
                                    <th>Coût</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${resources.map(resource => `
                                    <tr>
                                        <td>${resource.name}</td>
                                        <td>${resource.type}</td>
                                        <td>${resource.cost.toLocaleString()} FCFA</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                ${costs.length > 0 ? `
                    <div class="section">
                        <h2>Suivi des coûts</h2>
                        <table class="costs-table">
                            <thead>
                                <tr>
                                    <th>Budget</th>
                                    <th>Dépensé</th>
                                    <th>Reste</th>
                                    <th>Dernière mise à jour</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${costs.map(cost => `
                                    <tr>
                                        <td>${cost.budget.toLocaleString()} FCFA</td>
                                        <td>${cost.spent.toLocaleString()} FCFA</td>
                                        <td>${(cost.budget - cost.spent).toLocaleString()} FCFA</td>
                                        <td>${new Date(cost.updatedAt).toLocaleDateString('fr-FR')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                <div class="footer">
                    <p>Document généré automatiquement par TaskFlow</p>
                    <p>© ${new Date().getFullYear()} TaskFlow - Gestion de projets</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <button 
            onClick={handlePrint}
            className="btn btn-outline btn-sm"
            title="Imprimer la fiche du projet"
        >
            <Printer className="w-4 h-4" />
            Imprimer
        </button>
    );
};

export default PrintProject; 