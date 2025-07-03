import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
// Pas besoin d'importer TableRow car nous utilisons any[] pour analyses

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SchoolsChartProps {
  analyses?: any[];
  loading?: boolean;
}

const SchoolsChart: React.FC<SchoolsChartProps> = ({ 
  analyses = [], 
  loading = false 
}) => {
  // Traiter les données pour obtenir le nombre de détections par établissement
  const schoolsData = useMemo(() => {
    const schoolCounts: Record<string, number> = {};
    
    analyses.forEach((row: any) => {
      if (row.lycee) {
        schoolCounts[row.lycee] = (schoolCounts[row.lycee] || 0) + 1;
      }
    });
    
    // Trier les écoles par nombre de détections (décroissant)
    const sortedSchools = Object.entries(schoolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Limiter aux 10 premiers établissements
    
    return {
      labels: sortedSchools.map(([school]) => school),
      counts: sortedSchools.map(([, count]) => count)
    };
  }, [analyses]);
  
  const chartData = {
    labels: schoolsData.labels,
    datasets: [
      {
        label: 'Nombre de détections',
        data: schoolsData.counts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // Pour un graphique à barres horizontales
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 10 des établissements par nombre de détections',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Établissement'
        }
      },
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre de détections'
        }
      }
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">Comparaison par établissement</h2>
      
      <div className="h-80 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : analyses.length > 0 && schoolsData.labels.length > 0 ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Aucune donnée d'établissement disponible
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolsChart;
