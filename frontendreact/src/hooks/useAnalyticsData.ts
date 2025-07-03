import { useState, useEffect } from 'react';
import { buildAnalyticsUrl } from '../api/apiConfig';

interface AnalyticsData {
  analyses: any[];
  mobilityAnalyses: any[];
  verifiedAnalyses: any[];
  loading: boolean;
  error: string | null;
}

// No helper function needed - using actual API data

export const useAnalyticsData = (
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string
): AnalyticsData => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [mobilityAnalyses, setMobilityAnalyses] = useState<any[]>([]);
  const [verifiedAnalyses, setVerifiedAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      // We'll use our new utility function to build URLs with region parameter
      
      try {
        // Build API URL for analyses
        const apiUrl = buildAnalyticsUrl('analyses', startDate, endDate, startTime, endTime);
        console.log(`Fetching analyses from: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        const analysesData = await response.json();
        
        setAnalyses(analysesData || []);
        
        // Build API URL for mobility analyses
        const mobilityApiUrl = buildAnalyticsUrl('mobility_analyses', startDate, endDate, startTime, endTime);
        console.log(`Fetching mobility analyses from: ${mobilityApiUrl}`);
        
        const mobilityResponse = await fetch(mobilityApiUrl);
        const mobilityData = await mobilityResponse.json();
        
        setMobilityAnalyses(mobilityData || []);
        
        // Build API URL for verified analyses
        const verifiedApiUrl = buildAnalyticsUrl('verified_analyses', startDate, endDate, startTime, endTime);
        console.log(`Fetching verified analyses from: ${verifiedApiUrl}`);
        
        const verifiedResponse = await fetch(verifiedApiUrl);
        const verifiedData = await verifiedResponse.json();
        
        setVerifiedAnalyses(verifiedData || []);
        
      } catch (err: any) {
        console.error('Error fetching analytics data:', err);
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [startDate, endDate, startTime, endTime]);
  
  return {
    analyses,
    mobilityAnalyses,
    verifiedAnalyses,
    loading,
    error
  };
};
