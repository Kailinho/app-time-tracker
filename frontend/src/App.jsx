import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function App() {
  const [usageReport, setUsageReport] = useState({});
  const [websiteUsage, setWebsiteUsage] = useState({});
  const [reportPeriod, setReportPeriod] = useState(1); // 1 = Daily, 7 = Weekly, 30 = Monthly

  useEffect(() => {
    if (window.electron) {
      window.electron.onUpdateUsageReport((data) => setUsageReport(data));
      window.electron.onUpdateWebsiteReport((data) => setWebsiteUsage(data));
    }
  }, []);

  const formatTimeHHMM = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getChartData = (data, period) => {
    const dates = Object.keys(data).slice(-period);
    const aggregatedData = {};

    dates.forEach(date => {
      Object.entries(data[date] || {}).forEach(([key, times]) => {
        if (!aggregatedData[key]) {
          aggregatedData[key] = { name: key, activeTime: 0, backgroundTime: 0 };
        }
        aggregatedData[key].activeTime += times.activeTime || times;
        aggregatedData[key].backgroundTime += times.backgroundTime || 0;
      });
    });

    return Object.values(aggregatedData).map(entry => ({
      name: entry.name,
      activeTime: entry.activeTime / 60,
      backgroundTime: entry.backgroundTime / 60,
      activeTimeLabel: formatTimeHHMM(entry.activeTime),
      backgroundTimeLabel: formatTimeHHMM(entry.backgroundTime),
    }));
  };

  const appChartData = getChartData(usageReport, reportPeriod);
  const websiteChartData = getChartData(websiteUsage, reportPeriod);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Usage Reports</h1>

      {/* ✅ Report Toggle Buttons */}
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

      {/* ✅ App Usage Chart */}
      <h2 className="text-xl font-semibold mt-4">App Usage</h2>
      <ResponsiveContainer width="90%" height={300}>
        <BarChart data={appChartData}>
          <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
          <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(value, name, { payload }) => payload ? payload[name.toLowerCase() + "Label"] : value} />
          <Legend />
          <Bar dataKey="activeTime" fill="#34D399" name="Active Time" />
          <Bar dataKey="backgroundTime" fill="#EF4444" name="Background Time" />
        </BarChart>
      </ResponsiveContainer>

      {/* ✅ Website Usage Chart */}
      <h2 className="text-xl font-semibold mt-8">Website Usage</h2>
      <ResponsiveContainer width="90%" height={300}>
        <BarChart data={websiteChartData}>
          <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
          <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(value, name, { payload }) => payload ? payload[name.toLowerCase() + "Label"] : value} />
          <Legend />
          <Bar dataKey="activeTime" fill="#6366F1" name="Time Spent" />
        </BarChart>
      </ResponsiveContainer>

      {/* ✅ App Usage Table */}
      <h2 className="text-xl font-semibold mt-8">App Usage Details</h2>
      <div className="w-3/4 overflow-x-auto">
        <table className="border-collapse border border-gray-400 w-full mt-4">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-500 p-2">App</th>
              <th className="border border-gray-500 p-2">Active Time</th>
              <th className="border border-gray-500 p-2">Background Time</th>
            </tr>
          </thead>
          <tbody>
            {appChartData.map((row, index) => (
              <tr key={index} className="bg-gray-800">
                <td className="border border-gray-500 p-2">{row.name}</td>
                <td className="border border-gray-500 p-2">{row.activeTimeLabel}</td>
                <td className="border border-gray-500 p-2">{row.backgroundTimeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Website Usage Table */}
      <h2 className="text-xl font-semibold mt-8">Website Usage Details</h2>
      <div className="w-3/4 overflow-x-auto">
        <table className="border-collapse border border-gray-400 w-full mt-4">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-500 p-2">Website</th>
              <th className="border border-gray-500 p-2">Time Spent</th>
            </tr>
          </thead>
          <tbody>
            {websiteChartData.map((row, index) => (
              <tr key={index} className="bg-gray-800">
                <td className="border border-gray-500 p-2">{row.name}</td>
                <td className="border border-gray-500 p-2">{row.activeTimeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
