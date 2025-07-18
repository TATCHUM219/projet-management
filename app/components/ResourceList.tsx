import React from 'react';
import { Resource } from '@/type';

interface ResourceListProps {
  resources: Resource[];
  showProject?: boolean;
  showQuantity?: boolean;
  quantities?: Record<string, number>;
  onDelete?: (resourceId: string) => void;
}

const ResourceList: React.FC<ResourceListProps> = ({ resources, showProject = false, showQuantity = false, quantities = {}, onDelete }) => {
  if (!resources || resources.length === 0) {
    return <div className="my-4 text-gray-500">Aucune ressource</div>;
  }
  return (
    <div className="overflow-x-auto my-4">
      <table className="table table-sm w-full">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Coût</th>
            {showQuantity && <th>Quantité</th>}
            {showProject && <th>Projet</th>}
            {onDelete && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {resources.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>
                <span className={`badge ${r.type === 'HUMAN' ? 'badge-primary' : 'badge-secondary'}`}>{r.type === 'HUMAN' ? 'Humaine' : 'Matérielle'}</span>
              </td>
              <td>{r.cost} FCFA</td>
              {showQuantity && <td>{quantities[r.id] || '-'}</td>}
              {showProject && <td>{r.projectId}</td>}
              {onDelete && <td><button className="btn btn-xs btn-error" onClick={() => onDelete(r.id)}>Supprimer</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceList; 