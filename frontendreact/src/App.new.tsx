import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import './index.css'; // Make sure this is present!
import ApiDebug from "./ApiDebug";

// Import components
import Layout from "./components/Layout";
import Filters from "./components/Filters";
import SummaryCards from "./components/SummaryCards";
import TrendChart from "./components/TrendChart";
import DataTable from "./components/DataTable";
import LoadingOverlay from "./components/LoadingOverlay";

// Import pages
import Analytics from "./pages/Analytics";
import RegionsAnalytics from "./pages/RegionsAnalytics";
import VerificationAnalytics from "./pages/VerificationAnalytics";
import Settings from "./pages/Settings";

// Import hooks and utilities
import { useStatisticsData } from "./hooks/useStatisticsData";
import { getDefaultDate } from "./utils/dateUtils";

// Dashboard component extracted from the original App
const Dashboard = () => {
  // For date filtering - using a date that has data
  const defaultDate = getDefaultDate();
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  
  // For time filtering - default 8am to 6pm
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");

  // Use our custom hook to fetch and manage data
  const {
    summary,
    tableData,
    loadingSummary,
    loadingTable,
    errorSummary,
    errorTable
  } = useStatisticsData(startDate, endDate, startTime, endTime);

  // Handle exports
  const handleExport = () => {
    console.log("Export functionality to be implemented");
    // TODO: Implement export functionality
  };

  return (
    <>
      {/* Global loading overlay */}
      <LoadingOverlay isLoading={loadingSummary || loadingTable} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text mb-6">Tableau de Bord</h1>
        
        {/* Navigation links moved to sidebar */}
        
        {/* Filters */}
        <Filters
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
        />
      </div>

      {/* Summary Cards */}
      <SummaryCards 
        summary={summary} 
        loading={loadingSummary} 
      />

      {/* API Debug Component - Only shown when needed */}
      {false && (
        <section className="px-8 py-6">
          <ApiDebug />
        </section>
      )}

      {/* Main Content Section */}
      <section className="px-8 pb-8">
        {/* Trend Chart */}
        <TrendChart summaryData={summary} loading={loadingSummary} />

        {/* Data Table */}
        <DataTable 
          data={tableData} 
          loading={loadingTable} 
          error={errorTable} 
        />
      </section>
    </>
  );
};

// Wrapper component to handle export functionality based on current route
const AppContent = () => {
  const location = useLocation();
  
  // Handle exports based on current route
  const handleExport = () => {
    console.log("Export functionality to be implemented for", location.pathname);
    // TODO: Implement export functionality based on current route
  };

  // Only show export button on data pages, not on settings
  const showExport = location.pathname !== '/settings';
  
  return (
    <Layout onExport={showExport ? handleExport : undefined}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/regions" element={<RegionsAnalytics />} />
        <Route path="/verification" element={<VerificationAnalytics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
