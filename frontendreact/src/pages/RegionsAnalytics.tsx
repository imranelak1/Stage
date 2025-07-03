import React, { useState } from 'react';
import Filters from '../components/Filters';
import { getDefaultStartDate, getDefaultEndDate } from '../utils/dateUtils';
import { useStatisticsData } from '../hooks/useStatisticsData';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import RegionalDistributionChart from '../components/RegionalDistributionChart';
import LoadingOverlay from '../components/LoadingOverlay';

const RegionsAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Fetch statistics data for summary cards
  const { 
    summary: summaryData, 
    regionData,
    loadingSummary: statsLoading, 
    errorSummary: statsError 
  } = useStatisticsData(startDate, endDate, startTime, endTime);

  // Fetch analytics data for charts
  const { 
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

  // Using regionData directly from the API
  
  const isLoading = loading || statsLoading;
  const hasError = error || statsError;

  return (
    <>
      {isLoading && <LoadingOverlay isLoading={isLoading} />}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-6">Analytiques par Région</h1>
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

      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Distribution par Région</h2>
          <div className="h-96">
            <RegionalDistributionChart 
              regionData={regionData} 
              loading={isLoading} 
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Distribution des Détections par Région</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de Détections</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading || statsLoading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center">Chargement des données...</td>
                </tr>
              ) : regionData && regionData.length > 0 ? (
                <>
                  {regionData.map((region, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{region.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{region.count}</td>
                    </tr>
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center">Aucune donnée régionale disponible</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default RegionsAnalytics;
