import PropTypes from "prop-types";

/**
 * Report period toggle buttons for switching between Daily, Weekly, and Monthly views.
 *
 * @param {number} reportPeriod - The current selected period (1 = Daily, 7 = Weekly, 30 = Monthly).
 * @param {Function} setReportPeriod - Function to update the report period state.
 */
function ReportToggle({ reportPeriod, setReportPeriod }) {
  return (
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
  );
}

// Prop validation to avoid runtime errors
ReportToggle.propTypes = {
  reportPeriod: PropTypes.number.isRequired, // Must be a number (1, 7, or 30)
  setReportPeriod: PropTypes.func.isRequired, // Must be a function to update the state
};

export default ReportToggle;
