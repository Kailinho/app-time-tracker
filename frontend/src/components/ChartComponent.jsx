import PropTypes from "prop-types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * A reusable bar chart component for visualizing usage data.
 *
 * @param {Array} data - The dataset to be displayed in the chart.
 * @param {string} activeLabel - Label for active time.
 * @param {string} backgroundLabel - Label for background time.
 * @param {boolean} hasBackgroundTime - Whether background time should be displayed.
 */
function ChartComponent({ data,  activeLabel, backgroundLabel, hasBackgroundTime }) {
  return (
    <div className="mb-20">
      <ResponsiveContainer width="90%" height={350}>
        <BarChart data={data} barSize={data.length === 1 ? 30 : undefined}>
          <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
          <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
          <Tooltip
            formatter={(value, name, { payload }) =>
              name === activeLabel ? payload.activeTimeLabel : payload.backgroundTimeLabel
            }
          />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
          <Bar dataKey="activeTime" fill="#34D399" name={activeLabel} />
          {hasBackgroundTime && <Bar dataKey="backgroundTime" fill="#EF4444" name={backgroundLabel} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

//  Prop validation for ChartComponent
ChartComponent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      activeTime: PropTypes.number.isRequired,
      backgroundTime: PropTypes.number,
      activeTimeLabel: PropTypes.string.isRequired,
      backgroundTimeLabel: PropTypes.string,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  activeLabel: PropTypes.string.isRequired,
  backgroundLabel: PropTypes.string,
  hasBackgroundTime: PropTypes.bool,
};

// Default props for optional values
ChartComponent.defaultProps = {
  backgroundLabel: "Background Time",
  hasBackgroundTime: true,
};

export default ChartComponent;
