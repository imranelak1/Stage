import React from 'react';

interface SummaryData {
  potentiel: number;
  annote: number;
  confirme: number;
  fausse: number;
}

interface SummaryCardsProps {
  summary: SummaryData | null;
  loading: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => {
  return (
    <section className="px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Potentiel - Yellow */}
      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-xl shadow p-6 flex flex-col items-start">
        <span className="text-lg font-medium mb-2">Potentiel</span>
        <span className="text-3xl font-bold">
          {loading ? <span className="animate-pulse">...</span> : summary?.potentiel ?? "--"}
        </span>
      </div>
      {/* Annoté - Orange */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-xl shadow p-6 flex flex-col items-start">
        <span className="text-lg font-medium mb-2">Annoté</span>
        <span className="text-3xl font-bold">
          {loading ? <span className="animate-pulse">...</span> : summary?.annote ?? "--"}
        </span>
      </div>
      {/* Confirmé - Red */}
      <div className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl shadow p-6 flex flex-col items-start">
        <span className="text-lg font-medium mb-2">Confirmé</span>
        <span className="text-3xl font-bold">
          {loading ? <span className="animate-pulse">...</span> : summary?.confirme ?? "--"}
        </span>
      </div>
      {/* Fausse alerte - Grey */}
      <div className="bg-gradient-to-br from-gray-400 to-gray-600 text-white rounded-xl shadow p-6 flex flex-col items-start">
        <span className="text-lg font-medium mb-2">Fausse alerte</span>
        <span className="text-3xl font-bold">
          {loading ? <span className="animate-pulse">...</span> : summary?.fausse ?? "--"}
        </span>
      </div>
    </section>
  );
};

export default SummaryCards;
