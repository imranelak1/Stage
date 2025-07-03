import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

import type { SummaryData } from '../types';

interface DetectionTypeChartProps {
  summaryData?: SummaryData | null;
  loading?: boolean;
}

const DetectionTypeChart: React.FC<DetectionTypeChartProps> = ({
  summaryData,
  loading = false
}) => {
  // Use summary data or fallback to defaults
  const yellow = summaryData?.yellow || 10;
  const orange = summaryData?.orange || 5;
  const red = summaryData?.red || 3;
  const gray = summaryData?.gray || 2;
  
  const chartData: ChartData<'pie'> = {
    labels: ['Potentiel', 'Annoté', 'Confirmé', 'Fausse alerte'],
    datasets: [
      {
        data: [yellow, orange, red, gray],
        backgroundColor: [
          'rgba(234, 179, 8, 0.7)',  // yellow
          'rgba(249, 115, 22, 0.7)', // orange
          'rgba(239, 68, 68, 0.7)',  // red
          'rgba(107, 114, 128, 0.7)' // gray
        ],
        borderColor: [
          '#EAB308', // yellow-500
          '#F97316', // orange-500
          '#EF4444', // red-500
          '#6B7280'  // gray-500
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Distribution par type de détection',
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
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">Types de Détection</h2>
      <div className="h-64 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Pie data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default DetectionTypeChart;
