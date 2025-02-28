import { useEffect, useState } from "react";
import ChartComponent from "../components/ChartComponent";
import DataTable from "../components/DataTable";
import ReportToggle from "../components/ReportToggle";

function WebsiteUsage() {
  const [websiteUsage, setWebsiteUsage] = useState(() => {
    // Load previous data from localStorage
    const storedData = localStorage.getItem("websiteUsageData");
    return storedData ? JSON.parse(storedData) : {};
  });
  const [reportPeriod, setReportPeriod] = useState(1);

  // Listen for updates from Electron backend
  useEffect(() => {
    if (window.electron) {
      window.electron.onUpdateWebsiteReport((data) => {
        setWebsiteUsage({ ...data });
        localStorage.setItem("websiteUsageData", JSON.stringify(data));
      });
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
 * Processes website tracking data into a format suitable for charts and tables.
 * - Filters out websites with <10 min usage for all report periods.
 * - Ensures at least today's data is included if available.
 * - Aggregates multiple days for weekly/monthly reports.
 *
 * @param {object} data - The website tracking data.
 * @param {number} period - The report period (1 = Daily, 7 = Weekly, 30 = Monthly).
 * @returns {array} - Processed data.
 */
const getChartData = (data, period) => {
  if (!data || Object.keys(data).length === 0) {
    return []; // No data available
  }

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format
  const allDates = Object.keys(data).sort(); // Sort dates in ascending order
  let selectedDates = [];

  if (period === 1) {
    // If period = 1 (Daily), use only today's data (if available)
    selectedDates = allDates.includes(today) ? [today] : [];
  } else {
    // Otherwise, use last `period` days
    selectedDates = allDates.slice(-period);
  }

  const aggregatedData = {};

  selectedDates.forEach((date) => {
    if (!data[date]) return; // Skip missing dates

    Object.entries(data[date]).forEach(([domain, times]) => {
      if (!aggregatedData[domain]) {
        aggregatedData[domain] = { name: domain, activeTime: 0, backgroundTime: 0 };
      }

      // Only process correctly formatted data (activeTime, backgroundTime)
      if (typeof times === "object" && times.activeTime !== undefined && times.backgroundTime !== undefined) {
        aggregatedData[domain].activeTime += times.activeTime;
        aggregatedData[domain].backgroundTime += times.backgroundTime;
      }
    });
  });

  return Object.values(aggregatedData)
    .filter((entry) => entry.activeTime + entry.backgroundTime >= 600) // Exclude websites with <10 min for ALL periods
    .map((entry) => ({
      name: entry.name,
      activeTime: entry.activeTime / 60, // Convert seconds to minutes
      backgroundTime: entry.backgroundTime / 60,
      activeTimeLabel: formatTimeHHMM(entry.activeTime),
      backgroundTimeLabel: formatTimeHHMM(entry.backgroundTime),
    }));
};



  //  Generate chart data from `websiteUsage`
  const websiteChartData = getChartData(websiteUsage, reportPeriod);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Website Usage</h1>
      
      {/*  Period selection (Daily, Weekly, Monthly) */}
      <ReportToggle reportPeriod={reportPeriod} setReportPeriod={setReportPeriod} />
      
      {/*  Chart displaying website usage */}
      <ChartComponent 
        data={websiteChartData} 
        title="Website Usage" 
        activeLabel="Active Time" 
        backgroundLabel="Background Time" 
        hasBackgroundTime={false} 
      />

      {/*  Table displaying detailed website usage */}
      <DataTable data={websiteChartData} />
    </div>
  );
}

export default WebsiteUsage;
