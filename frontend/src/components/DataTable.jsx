import PropTypes from 'prop-types'
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from '@/components/ui/table'

/**
 * Reusable data table component for displaying app/website usage data.
 *
 * @param {Object[]} data - The processed table data.
 */
function DataTable({ data }) {
	return (
		<div className='w-full overflow-x-auto'>
			<h2 className='text-xl font-semibold mt-8 text-[#4361EE]'>
				Detailed Usage Table
			</h2>
			<Table className='mt-4'>
				<TableHeader>
					<TableRow className='border-b'>
						<TableHead>Name</TableHead>
						<TableHead>Active Time</TableHead>
						<TableHead>Background Time</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.length === 0 ? (
						<TableRow>
							<TableCell colSpan={3} className='text-center'>
								No data available/Waiting for data to load.
							</TableCell>
						</TableRow>
					) : (
						data.map((row, index) => (
							<TableRow key={index} className='border-0'>
								<TableCell>{row.name}</TableCell>
								<TableCell style={{ color: '#3A0CA3' }}>
									{row.activeTimeLabel || '0h 0m'}
								</TableCell>
								<TableCell style={{ color: '#D4C2FC' }}>
									{row.backgroundTimeLabel || '-'}
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	)
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
}

export default DataTable
