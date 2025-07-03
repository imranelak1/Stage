// API configuration
export const API_BASE = "http://127.0.0.1:8000/api";  // This endpoint returns valid JSON

/**
 * Builds the API URL for statistics with date and time parameters
 */
export const buildStatisticsUrl = (
  startDate: string, 
  endDate: string, 
  startTime: string, 
  endTime: string
): string => {
  let url = `${API_BASE}/statistics?start_time=${startDate} ${startTime}:00&end_time=${endDate} ${endTime}:00`;
  return url;
};

/**
 * Builds the API URL for analytics endpoints with date and time parameters
 */
export const buildAnalyticsUrl = (
  endpoint: string,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string
): string => {
  const startTimeStr = `${startDate} ${startTime}:00`;
  const endTimeStr = `${endDate} ${endTime}:00`;
  
  let url = `${API_BASE}/${endpoint}?start_time=${encodeURIComponent(startTimeStr)}&end_time=${encodeURIComponent(endTimeStr)}`;
  
  return url;
};
