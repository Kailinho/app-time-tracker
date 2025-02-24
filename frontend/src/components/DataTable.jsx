import PropTypes from "prop-types";

/**
 * Reusable data table component for displaying app/website usage data.
 *
 * @param {Object[]} data - The processed table data.
 * @param {string} title - The title of the table (e.g., "Application Usage", "Website Usage").
 */
function DataTable({ data, title }) {
  return (
    <div className="w-3/4 overflow-x-auto">
      <h2 className="text-xl font-semibold mt-8">{title}</h2>
      <table className="border-collapse border border-gray-400 w-full mt-4">
        <thead>
          <tr className="bg-gray-700">
            <th className="border border-gray-500 p-2">Name</th>
            <th className="border border-gray-500 p-2">Active Time</th>
            <th className="border border-gray-500 p-2">Background Time</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr className="bg-gray-800">
              <td colSpan="3" className="border border-gray-500 p-2 text-center">
                No data available.
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index} className="bg-gray-800">
                <td className="border border-gray-500 p-2">{row.name}</td>
                <td className="border border-gray-500 p-2">{row.activeTimeLabel || "0h 0m"}</td>
                <td className="border border-gray-500 p-2">{row.backgroundTimeLabel || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Prop validation to avoid runtime errors
DataTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      activeTimeLabel: PropTypes.string,
      backgroundTimeLabel: PropTypes.string,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
};

export default DataTable;
