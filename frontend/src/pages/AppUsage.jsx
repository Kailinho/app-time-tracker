import { useEffect, useState } from "react";
import ChartComponent from "../components/ChartComponent";
import DataTable from "../components/DataTable";
import ReportToggle from "../components/ReportToggle";

/**
 * AppUsage component that tracks application usage statistics.
 */
function AppUsage() {
  const [usageReport, setUsageReport] = useState({});
  const [reportPeriod, setReportPeriod] = useState(1);

  useEffect(() => {
    if (window.electron) {
      window.electron.onUpdateUsageReport((data) => setUsageReport({ ...data }));
    }
  }, []);

  /**
   * Formats time in seconds to "HHh MMm" format.
   * @param {number} seconds - The time in seconds.
   * @returns {string} - Formatted time string.
   */
  const formatTimeHHMM = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  /**
   * Processes app usage data into a format suitable for charts and tables.
   * @returns {Array} - Processed data.
   */
  const getChartData = (data, period) => {
    if (!data || Object.keys(data).length === 0) {
      return []; // No data available
    }
  
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format
    const allDates = Object.keys(data).sort(); // Sort dates in ascending order
    let selectedDates = [];
  
    if (period === 1) {
      // If Daily mode, use only today's data if available
      selectedDates = allDates.includes(today) ? [today] : [];
    } else {
      // Otherwise, get data for the last `period` days
      selectedDates = allDates.slice(-period);
    }
  
    const aggregatedData = {};
  
    selectedDates.forEach((date) => {
      Object.entries(data[date] || {}).forEach(([app, times]) => {
        if (!aggregatedData[app]) {
          aggregatedData[app] = { name: app, activeTime: 0, backgroundTime: 0 };
        }
        aggregatedData[app].activeTime += times.activeTime || 0;
        aggregatedData[app].backgroundTime += times.backgroundTime || 0;
      });
    });
  
    return Object.values(aggregatedData)
      .filter((entry) => entry.activeTime + entry.backgroundTime >= 600) // Filter out apps with <10 min usage
      .map((entry) => ({
        name: entry.name,
        activeTime: entry.activeTime / 60,
        backgroundTime: entry.backgroundTime / 60,
        activeTimeLabel: formatTimeHHMM(entry.activeTime),
        backgroundTimeLabel: formatTimeHHMM(entry.backgroundTime),
      }));
  };
  

  const appChartData = getChartData(usageReport,reportPeriod);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-4">App Usage</h1>
      <ReportToggle reportPeriod={reportPeriod} setReportPeriod={setReportPeriod} />
      <ChartComponent data={appChartData} title="Application Usage" activeLabel="Active Time" backgroundLabel="Background Time" hasBackgroundTime={true}/>
      <DataTable data={appChartData} />
    </div>
  );
}

export default AppUsage;
