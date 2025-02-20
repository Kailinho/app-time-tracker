import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function App() {
  const [usageReport, setUsageReport] = useState({});
  const [reportPeriod, setReportPeriod] = useState(1); // 1 = Daily, 7 = Weekly, 30 = Monthly

  useEffect(() => {
    if (window.electron) {
      window.electron.onUpdateUsageReport((data) => {
        setUsageReport(data);
      });
    }
  }, []);

  const formatTimeHHMM = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getChartData = (period) => {
    const dates = Object.keys(usageReport).slice(-period);

    const aggregatedData = {};

    dates.forEach(date => {
      Object.entries(usageReport[date] || {}).forEach(([app, times]) => {
        if (!aggregatedData[app]) {
          aggregatedData[app] = { app, activeTime: 0, backgroundTime: 0 };
        }
        aggregatedData[app].activeTime += times.activeTime;
        aggregatedData[app].backgroundTime += times.backgroundTime;
      });
    });

    return Object.values(aggregatedData).map(entry => ({
      app: entry.app,
      activeTime: entry.activeTime / 60, // Convert to minutes for chart bars
      backgroundTime: entry.backgroundTime / 60, // Convert to minutes for chart bars
      activeTimeLabel: formatTimeHHMM(entry.activeTime), // Store formatted time for tooltips
      backgroundTimeLabel: formatTimeHHMM(entry.backgroundTime),
    }));
  };

  const chartData = getChartData(reportPeriod);

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

      {/* ✅ Usage Report Chart */}
      <ResponsiveContainer width="90%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="app" angle={-45} textAnchor="end" interval={0} />
          <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
          <Tooltip
            formatter={(value, name, { payload }) => {
              if (!payload) return value;
              return name === "Active Time" ? payload.activeTimeLabel : payload.backgroundTimeLabel;
            }}
          />
          <Legend />
          <Bar dataKey="activeTime" fill="#34D399" name="Active Time" />
          <Bar dataKey="backgroundTime" fill="#EF4444" name="Background Time" />
        </BarChart>
      </ResponsiveContainer>

      {/* ✅ Usage Report Table */}
      <h2 className="text-xl font-semibold mt-8">Detailed Usage Data</h2>
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
            {chartData.map((row, index) => (
              <tr key={index} className="bg-gray-800">
                <td className="border border-gray-500 p-2">{row.app}</td>
                <td className="border border-gray-500 p-2">{row.activeTimeLabel}</td>
                <td className="border border-gray-500 p-2">{row.backgroundTimeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
