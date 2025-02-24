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
  const getChartData = () => {
    const dates = Object.keys(usageReport).slice(-reportPeriod);
    const aggregatedData = {};

    dates.forEach((date) => {
      Object.entries(usageReport[date] || {}).forEach(([app, times]) => {
        if (!aggregatedData[app]) {
          aggregatedData[app] = { name: app, activeTime: 0, backgroundTime: 0 };
        }
        aggregatedData[app].activeTime += times.activeTime;
        aggregatedData[app].backgroundTime += times.backgroundTime;
      });
    });

    return Object.values(aggregatedData)
      .filter((entry) => entry.activeTime + entry.backgroundTime >= 600)
      .map((entry) => ({
        name: entry.name,
        activeTime: entry.activeTime / 60,
        backgroundTime: entry.backgroundTime / 60,
        activeTimeLabel: formatTimeHHMM(entry.activeTime),
        backgroundTimeLabel: formatTimeHHMM(entry.backgroundTime),
      }));
  };

  const appChartData = getChartData();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">App Usage</h1>
      <ReportToggle reportPeriod={reportPeriod} setReportPeriod={setReportPeriod} />
      <ChartComponent data={appChartData} title="Application Usage" activeLabel="Active Time" backgroundLabel="Background Time" hasBackgroundTime={true}/>
      <DataTable data={appChartData} />
    </div>
  );
}

export default AppUsage;
