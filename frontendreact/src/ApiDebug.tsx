import { useState, useEffect } from 'react';

const API_BASE = "http://127.0.0.1:8000/api";

export default function ApiDebug() {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use a date that has data
  const dataDate = "2025-07-01"; // July 1st, 2025 which has data according to the logs
  
  // Default time range 8am to 6pm
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  
  useEffect(() => {
    const fetchData = async () => {
      const fetchStartTime = performance.now();
      setLoading(true);
      try {
        // Make the API call with explicit date and time parameters
        const response = await fetch(`${API_BASE}/statistics?start_time=${dataDate} ${startTime}:00&end_time=${dataDate} ${endTime}:00`);
        
        // Check if the response is OK
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse JSON directly
        const data = await response.json();
        console.log(`ApiDebug: Data received in ${(performance.now() - fetchStartTime).toFixed(2)}ms`);
        
        // Set the API data state
        setApiData(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching API data:', err);
        setError(err.message || 'An error occurred while fetching data');
        setApiData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dataDate, startTime, endTime]);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">API Debug Information</h2>
      
      {loading && <p className="text-gray-600">Loading API data...</p>}
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">API Endpoint:</h3>
            <code className="bg-gray-100 p-2 rounded block">
              {`${API_BASE}/statistics?start_time=${dataDate} ${startTime}:00&end_time=${dataDate} ${endTime}:00`}
            </code>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Time Range:</h3>
            <div className="flex items-center gap-2">
              <input type="time" className="border rounded px-2 py-1 text-text focus:outline-primary" value={startTime} onChange={e => setStartTime(e.target.value)} />
              <span className="mx-1 text-text-muted">-</span>
              <input type="time" className="border rounded px-2 py-1 text-text focus:outline-primary" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Response Data:</h3>
            {apiData ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            ) : (
              <p className="text-red-600">No data received from API</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
