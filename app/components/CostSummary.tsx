import React from 'react';
import { Cost } from '@/type';

interface CostSummaryProps {
  costs: Cost[];
}

const CostSummary: React.FC<CostSummaryProps> = ({ costs }) => {
  if (!costs || costs.length === 0) {
    return <div className="my-4 text-gray-500">Aucun coût renseigné</div>;
  }
  // On prend le dernier coût comme état actuel
  const latest = costs.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
  const percent = latest.budget > 0 ? Math.round((latest.spent / latest.budget) * 100) : 0;
  return (
    <div className="my-4 p-4 border rounded-xl bg-base-100">
      <div className="font-bold mb-2">Suivi des coûts</div>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <span className="badge badge-primary mr-2">Budget</span>
          <span className="font-semibold">{latest.budget} FCFA</span>
        </div>
        <div>
          <span className="badge badge-secondary mr-2">Dépensé</span>
          <span className="font-semibold">{latest.spent} FCFA</span>
        </div>
        <div>
          <span className="badge badge-ghost mr-2">Reste</span>
          <span className="font-semibold">{latest.budget - latest.spent} FCFA</span>
        </div>
      </div>
      <progress className="progress progress-primary w-full mt-4" value={percent} max="100"></progress>
      <div className="text-xs text-gray-500 mt-1">{percent}% du budget utilisé</div>
    </div>
  );
};

export default CostSummary; 