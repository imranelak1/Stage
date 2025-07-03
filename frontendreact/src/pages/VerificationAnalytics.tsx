import React, { useState } from 'react';
import Filters from '../components/Filters';
import { getDefaultStartDate, getDefaultEndDate } from '../utils/dateUtils';
import { useStatisticsData } from '../hooks/useStatisticsData';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import VerificationStatusChart from '../components/VerificationStatusChart';
import LoadingOverlay from '../components/LoadingOverlay';

const VerificationAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Fetch statistics data for summary cards
  const { 
    summary: summaryData, 
    loadingSummary: statsLoading, 
    errorSummary: statsError 
  } = useStatisticsData(startDate, endDate, startTime, endTime);

  // Fetch analytics data for charts
  const { 
    verifiedAnalyses,
    loading, 
    error 
  } = useAnalyticsData(startDate, endDate, startTime, endTime);

  const handleFilterChange = (
    newStartDate: string,
    newEndDate: string,
    newStartTime: string,
    newEndTime: string,
    newRegion: string
  ) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setStartTime(newStartTime);
    setEndTime(newEndTime);
    setSelectedRegion(newRegion);
  };

  const isLoading = loading || statsLoading;
  const hasError = error || statsError;

  return (
    <>
      {isLoading && <LoadingOverlay isLoading={isLoading} />}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-6">Analytiques de Vérification</h1>
        <Filters
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          selectedRegion={selectedRegion}
          onFilterChange={handleFilterChange}
        />
      </div>

      {hasError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Une erreur est survenue lors du chargement des données.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Statut des Vérifications</h2>
          <div className="h-80">
            <VerificationStatusChart loading={isLoading} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Temps de Vérification</h2>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {isLoading ? '...' : '14.3'}
              </div>
              <div className="text-gray-500">Minutes en moyenne</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Dernières Vérifications</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vérificateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps (min)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">Chargement des données...</td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">03/07/2025 10:23</td>
                    <td className="px-6 py-4 whitespace-nowrap">Ahmed Benani</td>
                    <td className="px-6 py-4 whitespace-nowrap">Casablanca-Settat</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Confirmé
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">12</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">03/07/2025 09:45</td>
                    <td className="px-6 py-4 whitespace-nowrap">Fatima Zahra</td>
                    <td className="px-6 py-4 whitespace-nowrap">Rabat-Salé-Kénitra</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Rejeté
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">8</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">03/07/2025 09:12</td>
                    <td className="px-6 py-4 whitespace-nowrap">Karim Idrissi</td>
                    <td className="px-6 py-4 whitespace-nowrap">Marrakech-Safi</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Confirmé
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">15</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default VerificationAnalytics;
