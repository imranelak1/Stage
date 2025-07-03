import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RegionData {
  name: string;
  count: number;
}

interface RegionalDistributionChartProps {
  regionData?: RegionData[];
  loading?: boolean;
}

const RegionalDistributionChart: React.FC<RegionalDistributionChartProps> = ({
  regionData = [],
  loading = false
}) => {
  // Use only real data from API
  const chartData = useMemo(() => {
    // Take top 10 regions if we have more
    const regions = regionData.length > 0 
      ? regionData.slice(0, 10) 
      : [];

    return {
      labels: regions.map(r => r.name),
      datasets: [
        {
          label: 'Nombre de détections',
          data: regions.map(r => r.count),
          backgroundColor: 'rgba(37, 99, 235, 0.7)', // blue-600 with opacity
          borderColor: '#1e40af', // blue-800
          borderWidth: 1
        }
      ]
    } as ChartData<'bar'>;
  }, [regionData]);

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribution par région',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.x}`;
          }
        }
      }
    },
    scales: {
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
      <h2 className="text-xl font-semibold text-text mb-4">Distribution Régionale</h2>
      <div className="h-80 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default RegionalDistributionChart;
