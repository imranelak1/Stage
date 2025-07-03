import { useState, useEffect } from 'react';
import { buildStatisticsUrl } from '../api/apiConfig';
import type { SummaryData, TableRow } from '../types';

// TableRow is now imported from types

interface RegionData {
  name: string;
  count: number;
}

interface HourlyData {
  hour: string;
  count: number;
}

interface DayOfWeekData {
  day: string;
  count: number;
}

interface CommunicationTypeData {
  yellow: number;
  orange: number;
  red: number;
  gray: number;
}

interface CommunicationTypesData {
  vocal: CommunicationTypeData;
  data: CommunicationTypeData;
  whatsapp: CommunicationTypeData;
  [key: string]: CommunicationTypeData;
}

interface StatisticsData {
  summary: SummaryData | null;
  tableData: TableRow[];
  regionData: RegionData[];
  hourlyData: HourlyData[];
  dayOfWeekData: DayOfWeekData[];
  communicationTypesData: CommunicationTypesData | null;
  loadingSummary: boolean;
  loadingTable: boolean;
  errorSummary: string | null;
  errorTable: string | null;
}

export const useStatisticsData = (
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string
): StatisticsData => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<DayOfWeekData[]>([]);
  const [communicationTypesData, setCommunicationTypesData] = useState<CommunicationTypesData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorTable, setErrorTable] = useState<string | null>(null);

  useEffect(() => {
    // Set loading states
    setLoadingSummary(true);
    setLoadingTable(true);
    setErrorSummary(null);
    setErrorTable(null);
    
    // Build API URL for statistics
    const apiUrl = buildStatisticsUrl(startDate, endDate, startTime, endTime);
    console.log(`Fetching data from: ${apiUrl}`);
    
    // Performance timestamp for measuring load time
    const fetchStartTime = performance.now();
    
    fetch(apiUrl)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}`);
        }
        
        return response.json();
      })
      .then(data => {
        console.log("Data received in", (performance.now() - fetchStartTime).toFixed(2), "ms:", data);
        
        // Process summary data - always use API data
        let summaryData;
        
        if (data && data.summaryData) {
          summaryData = {
            potentiel: data.summaryData.yellow || 0,
            annote: data.summaryData.orange || 0,
            confirme: data.summaryData.red || 0,
            fausse: data.summaryData.gray || 0,
            // Add aliases for chart components
            yellow: data.summaryData.yellow || 0,
            orange: data.summaryData.orange || 0,
            red: data.summaryData.red || 0,
            gray: data.summaryData.gray || 0
          };
        } else {
          summaryData = { 
            potentiel: 0, annote: 0, confirme: 0, fausse: 0,
            yellow: 0, orange: 0, red: 0, gray: 0
          };
        }
        
        setSummary(summaryData);
        
        // Store region data directly from API
        if (data && data.regionData && Array.isArray(data.regionData)) {
          setRegionData(data.regionData);
        } else {
          setRegionData([]);
        }
        
        // Store hourly distribution data
        if (data && data.hourlyDistributionData && Array.isArray(data.hourlyDistributionData)) {
          setHourlyData(data.hourlyDistributionData);
        } else {
          setHourlyData([]);
        }
        
        // Store day of week data
        if (data && data.dayOfWeekData && Array.isArray(data.dayOfWeekData)) {
          setDayOfWeekData(data.dayOfWeekData);
        } else {
          setDayOfWeekData([]);
        }
        
        // Extract communication types data
        if (data && data.communicationTypesData) {
          setCommunicationTypesData({
            vocal: {
              yellow: data.communicationTypesData.vocal?.yellow || 0,
              orange: data.communicationTypesData.vocal?.orange || 0,
              red: data.communicationTypesData.vocal?.red || 0,
              gray: data.communicationTypesData.vocal?.gray || 0
            },
            data: {
              yellow: data.communicationTypesData.data?.yellow || 0,
              orange: data.communicationTypesData.data?.orange || 0,
              red: data.communicationTypesData.data?.red || 0,
              gray: data.communicationTypesData.data?.gray || 0
            },
            whatsapp: {
              yellow: data.communicationTypesData.whatsapp?.yellow || 0,
              orange: data.communicationTypesData.whatsapp?.orange || 0,
              red: data.communicationTypesData.whatsapp?.red || 0,
              gray: data.communicationTypesData.whatsapp?.gray || 0
            }
          });
        } else {
          setCommunicationTypesData(null);
        }
        
        // Process table data for the table component
        if (data && data.regionData && Array.isArray(data.regionData)) {
          let allRows = data.regionData.map((row: any) => ({
            ...row,
            _type: row.status === "yellow" ? "Potentiel" : 
                  row.status === "orange" ? "Annoté" : 
                  row.status === "red" ? "Confirmé" : "Fausse alerte"
          }));
          
          // Sort by date descending
          allRows.sort((a: any, b: any) => (b.date > a.date ? 1 : -1));
          setTableData(allRows);
        } else {
          setTableData([]);
        }
        
        // Clear loading states
        setLoadingSummary(false);
        setLoadingTable(false);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
        setErrorSummary(err.message || "Failed to fetch data");
        setErrorTable(err.message || "Failed to fetch data");
        setLoadingSummary(false);
        setLoadingTable(false);
      });
  }, [startDate, endDate, startTime, endTime]);

  return {
    summary,
    tableData,
    regionData,
    hourlyData,
    dayOfWeekData,
    communicationTypesData,
    loadingSummary,
    loadingTable,
    errorSummary,
    errorTable
  };
};
