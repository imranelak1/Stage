import React, { useState } from 'react';
import Filters from '../components/Filters';
import TrendChart from '../components/TrendChart';
import DetectionTypeChart from '../components/DetectionTypeChart';
import RegionalDistributionChart from '../components/RegionalDistributionChart';
import VerificationStatusChart from '../components/VerificationStatusChart';
import SchoolsChart from '../components/SchoolsChart';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { useStatisticsData } from '../hooks/useStatisticsData';
import { getDefaultStartDate, getDefaultEndDate, formatDateForDisplay } from '../utils/dateUtils';
import LoadingOverlay from '../components/LoadingOverlay';

const Analytics: React.FC = () => {
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedRegion, setSelectedRegion] = useState<string>('Tous');

  // Fetch statistics data for summary cards
  const { 
    summary: summaryData, 
    hourlyData,
    regionData,
    tableData,
    communicationTypesData,
    loadingSummary: statsLoading, 
    errorSummary: statsError 
  } = useStatisticsData(startDate, endDate, startTime, endTime);

  // Fetch analytics data for charts
  const {
    analyses,
    mobilityAnalyses,
    verifiedAnalyses,
    loading: analyticsLoading,
    error: analyticsError
  } = useAnalyticsData(startDate, endDate, startTime, endTime);

  // Calculate verification stats
  const verificationStats = React.useMemo(() => {
    if (!verifiedAnalyses || verifiedAnalyses.length === 0) {
      return { verified: 0, denied: 0 };
    }
    
    // This is a placeholder calculation - adjust based on actual data structure
    const verified = verifiedAnalyses.filter(item => item.status === 'confirmed').length;
    const denied = verifiedAnalyses.filter(item => item.status === 'denied').length;
    
    return { verified, denied };
  }, [verifiedAnalyses]);

  // Using regionData directly from the API

  // Format date range for display in charts
  const dateRangeDisplay = React.useMemo(() => {
    if (startDate === endDate) {
      return formatDateForDisplay(startDate);
    }
    return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
  }, [startDate, endDate]);

  const loading = statsLoading || analyticsLoading;
  const error = statsError || analyticsError;

  return (
    <>
      {loading && <LoadingOverlay isLoading={loading} />}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-6">Tableau de Bord Analytique</h1>
        
        <Filters
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          selectedRegion={selectedRegion}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onRegionChange={setSelectedRegion}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Erreur de chargement des données</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TrendChart 
          hourlyData={hourlyData}
          communicationTypesData={communicationTypesData} 
          loading={loading} 
          dateRange={dateRangeDisplay}
        />
        <DetectionTypeChart 
          summaryData={summaryData} 
          loading={loading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RegionalDistributionChart 
          regionData={regionData} 
          loading={loading} 
        />
        <VerificationStatusChart 
          verifiedCount={verificationStats.verified} 
          deniedCount={verificationStats.denied}
          loading={loading} 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SchoolsChart
          analyses={analyses}
          loading={loading}
        />
      </div>
    </>
  );
};

export default Analytics;
