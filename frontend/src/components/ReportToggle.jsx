import PropTypes from 'prop-types'

/**
 * Report period dropdown for switching between Daily, Weekly, and Monthly views.
 *
 * @param {number} reportPeriod - The current selected period (1 = Daily, 7 = Weekly, 30 = Monthly).
 * @param {Function} setReportPeriod - Function to update the report period state.
 */
function ReportToggle({ reportPeriod, setReportPeriod }) {
	return (
		<div className='relative ml-4'>
			<select
				className='appearance-none bg-muted text-foreground border border-blue-600 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 pr-8 transition-colors'
				value={reportPeriod}
				onChange={(e) => setReportPeriod(Number(e.target.value))}
				aria-label='Select report period'
			>
				<option value={1}>Daily</option>
				<option value={7}>Weekly</option>
				<option value={30}>Monthly</option>
			</select>
			<svg
				className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600'
				fill='none'
				stroke='currentColor'
				strokeWidth='2'
				viewBox='0 0 24 24'
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					d='M19 9l-7 7-7-7'
				/>
			</svg>
		</div>
	)
}

// Prop validation to avoid runtime errors
ReportToggle.propTypes = {
	reportPeriod: PropTypes.number.isRequired, // Must be a number (1, 7, or 30)
	setReportPeriod: PropTypes.func.isRequired, // Must be a function to update the state
}

export default ReportToggle
