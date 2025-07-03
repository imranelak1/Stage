import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface VerificationStatusChartProps {
  verifiedCount?: number;
  deniedCount?: number;
  loading?: boolean;
}

const VerificationStatusChart: React.FC<VerificationStatusChartProps> = ({
  verifiedCount = 0,
  deniedCount = 0,
  loading = false
}) => {
  // Use only real data from API
  const confirmed = verifiedCount || 0;
  const denied = deniedCount || 0;
  
  const chartData: ChartData<'doughnut'> = {
    labels: ['Confirmé', 'Refusé'],
    datasets: [
      {
        data: [confirmed, denied],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',  // green-500
          'rgba(239, 68, 68, 0.7)',   // red-500
        ],
        borderColor: [
          '#16A34A', // green-600
          '#DC2626', // red-600
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Statut de vérification',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">Statut de Vérification</h2>
      <div className="h-64 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Doughnut data={chartData} options={chartOptions} />
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="p-2 rounded-lg bg-green-50 border border-green-100">
          <p className="text-green-700 font-medium">Confirmés</p>
          <p className="text-2xl font-bold text-green-600">{confirmed}</p>
        </div>
        <div className="p-2 rounded-lg bg-red-50 border border-red-100">
          <p className="text-red-700 font-medium">Refusés</p>
          <p className="text-2xl font-bold text-red-600">{denied}</p>
        </div>
      </div>
    </div>
  );
};

export default VerificationStatusChart;
