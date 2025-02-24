import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function App() {
  // State to store application usage data
  const [usageReport, setUsageReport] = useState({});
  // State to store website tracking data
  const [websiteUsage, setWebsiteUsage] = useState({});
  // Controls the report period (1 = Daily, 7 = Weekly, 30 = Monthly)
  const [reportPeriod, setReportPeriod] = useState(1);

  /**
   * Effect hook to listen for updates from Electron.
   * - Updates `usageReport` when app usage data is received.
   * - Updates `websiteUsage` when website tracking data is received.
   */
  useEffect(() => {
    if (window.electron) {
      window.electron.onUpdateUsageReport((data) => setUsageReport({ ...data }));
      window.electron.onUpdateWebsiteReport((data) => {
        console.log("Updating website usage:", data);
        setWebsiteUsage({ ...data });
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
   * Processes usage data to generate chart-friendly format.
   * - Aggregates active and background time for apps/websites.
   * - Filters out entries with less than 10 minutes of total usage.
   *
   * @param {object} data - The usage data (app or website).
   * @param {number} period - The report period (1 = Daily, 7 = Weekly, 30 = Monthly).
   * @returns {array} - Processed data ready for the chart.
   */
  const getChartData = (data, period) => {
    const dates = Object.keys(data).slice(-period);
    const aggregatedData = {};

    dates.forEach((date) => {
      Object.entries(data[date] || {}).forEach(([key, times]) => {
        if (!aggregatedData[key]) {
          aggregatedData[key] = { name: key, activeTime: 0, backgroundTime: 0 };
        }
        aggregatedData[key].activeTime += times.activeTime || times;
        aggregatedData[key].backgroundTime += times.backgroundTime || 0;
      });
    });

    return Object.values(aggregatedData)
      .filter((entry) => entry.activeTime + entry.backgroundTime >= 600) // Show only items with >10 min usage
      .map((entry) => ({
        name: entry.name,
        activeTime: entry.activeTime / 60, // Convert seconds to minutes
        backgroundTime: entry.backgroundTime / 60,
        activeTimeLabel: formatTimeHHMM(entry.activeTime),
        backgroundTimeLabel: formatTimeHHMM(entry.backgroundTime),
      }));
  };

  // Generate data for application and website charts
  const appChartData = getChartData(usageReport, reportPeriod);
  const websiteChartData = getChartData(websiteUsage, reportPeriod);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Usage Reports</h1>

      {/* Report Period Toggle Buttons */}
      <div className="flex gap-4 mt-6 mb-6">
        <button
          onClick={() => setReportPeriod(1)}
          className={`px-4 py-2 rounded ${reportPeriod === 1 ? "bg-blue-500" : "bg-gray-700"} hover:bg-blue-400`}
        >
          Daily
        </button>
        <button
          onClick={() => setReportPeriod(7)}
          className={`px-4 py-2 rounded ${reportPeriod === 7 ? "bg-blue-500" : "bg-gray-700"} hover:bg-blue-400`}
        >
          Weekly
        </button>
        <button
          onClick={() => setReportPeriod(30)}
          className={`px-4 py-2 rounded ${reportPeriod === 30 ? "bg-blue-500" : "bg-gray-700"} hover:bg-blue-400`}
        >
          Monthly
        </button>
      </div>

      {/* App Usage Chart */}
      <h2 className="text-xl font-semibold mt-4">App Usage</h2>
      <div className="my-auto">
        <ResponsiveContainer width="90%" height={350}>
          <BarChart data={appChartData} barSize={appChartData.length === 1 ? 30 : undefined}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
            <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
            <Tooltip
              formatter={(value, name, { payload }) =>
                name === "Active Time" ? payload.activeTimeLabel : payload.backgroundTimeLabel
              }
            />
            <Legend layout="vertical" align="right" verticalAlign="middle" />
            <Bar dataKey="activeTime" fill="#34D399" name="Active Time" />
            <Bar dataKey="backgroundTime" fill="#EF4444" name="Background Time" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Website Usage Chart */}
      <h2 className="text-xl font-semibold mt-8 mb-20">Website Usage</h2>
      <div className="mb-12">
        <ResponsiveContainer width="90%" height={350}>
          <BarChart data={websiteChartData} barSize={websiteChartData.length === 1 ? 30 : undefined}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
            <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
            <Tooltip
              formatter={(value, name, { payload }) =>
                name === "Time Spent" ? payload.activeTimeLabel : payload.backgroundTimeLabel
              }
            />
            <Legend layout="vertical" align="right" verticalAlign="middle" />
            <Bar dataKey="activeTime" fill="#6366F1" name="Time Spent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Usage Data Table */}
      <h2 className="text-xl font-semibold mt-8">Detailed Usage Data</h2>
      <div className="w-3/4 overflow-x-auto">
        <table className="border-collapse border border-gray-400 w-full mt-4">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-500 p-2">App/Website</th>
              <th className="border border-gray-500 p-2">Active Time</th>
              <th className="border border-gray-500 p-2">Background Time</th>
            </tr>
          </thead>
          <tbody>
            {appChartData.concat(websiteChartData).map((row, index) => (
              <tr key={index} className="bg-gray-800">
                <td className="border border-gray-500 p-2">{row.name}</td>
                <td className="border border-gray-500 p-2">{row.activeTimeLabel}</td>
                <td className="border border-gray-500 p-2">{row.backgroundTimeLabel || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
