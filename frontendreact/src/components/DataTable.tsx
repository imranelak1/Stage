import React from 'react';

interface TableRow {
  _type: string;
  date: string;
  operateur: string;
  aref: string;
  ville: string;
  lycee: string;
  salle: string;
  matiere: string;
  verificateur_name: string;
  cne: string;
  status: string;
  [key: string]: any; // For any other properties
}

interface DataTableProps {
  data: TableRow[];
  loading: boolean;
  error: string | null;
}

const DataTable: React.FC<DataTableProps> = ({ data, loading, error }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold text-text mb-4">Détails des Analyses</h2>
      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-muted">Chargement...</div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-background-subtle text-text-muted">
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Opérateur</th>
                <th className="px-3 py-2 text-left">Région</th>
                <th className="px-3 py-2 text-left">Ville</th>
                <th className="px-3 py-2 text-left">Centre</th>
                <th className="px-3 py-2 text-left">Salle</th>
                <th className="px-3 py-2 text-left">Matière</th>
                <th className="px-3 py-2 text-left">Vérificateur</th>
                <th className="px-3 py-2 text-left">CNE</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-text-muted">Aucune donnée</td>
                </tr>
              ) : (
                data.slice(0, 30).map((row, i) => (
                  <tr key={i} className="border-b last:border-none hover:bg-background-subtle/60">
                    <td className="px-3 py-2 font-semibold text-text">
                      {row._type}
                    </td>
                    <td className="px-3 py-2">{row.date?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="px-3 py-2">{row.operateur || '-'}</td>
                    <td className="px-3 py-2">{row.aref || '-'}</td>
                    <td className="px-3 py-2">{row.ville || '-'}</td>
                    <td className="px-3 py-2">{row.lycee || '-'}</td>
                    <td className="px-3 py-2">{row.salle || '-'}</td>
                    <td className="px-3 py-2">{row.matiere || '-'}</td>
                    <td className="px-3 py-2">{row.verificateur_name || '-'}</td>
                    <td className="px-3 py-2">{row.cne || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {data.length > 30 && (
            <div className="text-right text-xs text-text-muted mt-2">Affichage des 30 premières lignes</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataTable;
