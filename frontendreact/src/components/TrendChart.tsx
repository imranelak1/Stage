import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HourlyData {
  hour: string;
  count: number;
}

interface TrendChartProps {
  hourlyData?: HourlyData[];
  communicationTypesData?: any;
  loading?: boolean;
  dateRange?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  hourlyData = [], 
  communicationTypesData = null,
  loading = false, 
  dateRange = 'Aujourd\'hui' 
}) => {
  // Extract hours and counts from API data
  const hourlyChartData = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      // Fallback to empty data if no API data available
      const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}h`);
      return {
        hours,
        counts: hours.map(() => 0)
      };
    }
    
    // Extract hours and counts from API data
    const hours = hourlyData.map(item => item.hour);
    const counts = hourlyData.map(item => item.count);
    
    return { hours, counts };
  }, [hourlyData]);
  
  // Prepare data for different detection types
  const detectionTypesData = useMemo(() => {
    if (!communicationTypesData) return null;
    
    // Extract data for different communication types
    const vocal = communicationTypesData.vocal || {};
    const data = communicationTypesData.data || {};
    const whatsapp = communicationTypesData.whatsapp || {};
    
    return {
      vocal,
      data,
      whatsapp
    };
  }, [communicationTypesData]);
  
  const chartData: ChartData<'line'> = {
    labels: hourlyChartData.hours,
    datasets: [
      {
        label: 'Total des analyses',
        data: hourlyChartData.counts,
        borderColor: '#3B82F6', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      },
      // If we have detailed data, add more datasets
      ...(detectionTypesData ? [
        {
          label: 'Vocal',
          data: hourlyChartData.hours.map(() => 
            detectionTypesData.vocal.yellow + 
            detectionTypesData.vocal.orange + 
            detectionTypesData.vocal.red || 0),
          borderColor: '#EF4444', // red-500
          backgroundColor: 'rgba(239, 68, 68, 0.0)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3
        },
        {
          label: 'Data',
          data: hourlyChartData.hours.map(() => 
            detectionTypesData.data.yellow + 
            detectionTypesData.data.orange + 
            detectionTypesData.data.red || 0),
          borderColor: '#F59E0B', // amber-500
          backgroundColor: 'rgba(245, 158, 11, 0.0)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3
        },
        {
          label: 'WhatsApp',
          data: hourlyChartData.hours.map(() => 
            detectionTypesData.whatsapp.yellow + 
            detectionTypesData.whatsapp.orange + 
            detectionTypesData.whatsapp.red || 0),
          borderColor: '#10B981', // emerald-500
          backgroundColor: 'rgba(16, 185, 129, 0.0)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3
        }
      ] : [])
    ]
  };
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Tendance des détections par heure (${dateRange})`,
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          afterTitle: function() {
            // Afficher les régions dans le tooltip
            return 'Distribution par région:';
          },
          afterBody: function(context) {
            // Si nous avons des données de région, les afficher
            // Ceci est un exemple - vous devrez adapter selon vos données réelles
            if (communicationTypesData) {
              // Créer une liste des régions avec leurs nombres
              const regions = [
                'Casablanca-Settat: ' + Math.round(context[0].parsed.y * 0.3),
                'Rabat-Salé-Kénitra: ' + Math.round(context[0].parsed.y * 0.25),
                'Marrakech-Safi: ' + Math.round(context[0].parsed.y * 0.15),
                'Fès-Meknès: ' + Math.round(context[0].parsed.y * 0.1),
                'Souss-Massa: ' + Math.round(context[0].parsed.y * 0.1),
                'Oriental: ' + Math.round(context[0].parsed.y * 0.05),
                'Autres régions: ' + Math.round(context[0].parsed.y * 0.05)
              ];
              return regions;
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre de détections'
        },
        stacked: false
      },
      x: {
        title: {
          display: true,
          text: 'Heure'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Nous avons supprimé l'affichage des statistiques car elles sont déjà présentes ailleurs dans la page

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">Tendances et Analyses</h2>
      
      <div className="h-64 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default TrendChart;
