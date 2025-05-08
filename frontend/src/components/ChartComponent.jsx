import PropTypes from 'prop-types'
import ReactApexChart from 'react-apexcharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function ChartComponent({
	title,
	data,
	activeLabel,
	backgroundLabel,
	hasBackgroundTime,
}) {
	const formatTimeHHMM = (seconds) => {
		if (!seconds || isNaN(seconds)) return '0h 0m'
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.floor((seconds % 3600) / 60)
		return `${hours}h ${minutes}m`
	}

	const options = {
		colors: ['#1A56DB', '#FDBA8C'],
		chart: {
			type: 'bar',
			height: '360px',
			fontFamily: 'Inter, sans-serif',
			toolbar: { show: false },
		},
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '80%',
				borderRadiusApplication: 'end',
				borderRadius: 4,
			},
		},
		tooltip: {
			enabled: true,
			shared: true,
			intersect: false,
			followCursor: true,
			style: { fontFamily: 'Inter, sans-serif' },
			theme: 'dark',
			y: { formatter: (val) => formatTimeHHMM(val * 60) },
		},

		states: {
			hover: { filter: { type: 'darken', value: 1 } },
		},
		stroke: { show: true, width: 0, colors: ['transparent'] },
		grid: {
			show: false,
			strokeDashArray: 4,
			padding: { left: 2, right: 2, top: -14 },
		},
		dataLabels: { enabled: false },
		legend: { show: false },
		xaxis: {
			categories: data.map((entry) => entry.name),
			labels: {
				show: true,
				rotate: -90,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass:
						'text-xs font-normal fill-gray-500 dark:fill-gray-400',
				},
			},
			axisBorder: { show: false },
			axisTicks: { show: false },
		},
		yaxis: { show: false },
		fill: { opacity: 1 },
	}

	const series = [
		{
			name: activeLabel,
			data: data.map((entry) => entry.activeTime),
			color: '#3A0CA3',
		},
	]

	if (hasBackgroundTime) {
		series.push({
			name: backgroundLabel,
			data: data.map((entry) => entry.backgroundTime),
			color: '#D4C2FC',
		})
	}

	return (
		<Card className='w-full border-none shadow-none'>
			<CardHeader>
				<CardTitle className='text-xl font-semibold'>{title}</CardTitle>
			</CardHeader>
			<CardContent className='w-full p-0 md:p-6'>
				<ReactApexChart
					options={options}
					series={series}
					type='bar'
					height={320}
					width='100%'
				/>
			</CardContent>
		</Card>
	)
}

// Prop validation
ChartComponent.propTypes = {
	title: PropTypes.string.isRequired,
	data: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			activeTime: PropTypes.number.isRequired,
			backgroundTime: PropTypes.number,
		})
	).isRequired,
	activeLabel: PropTypes.string.isRequired,
	backgroundLabel: PropTypes.string,
	hasBackgroundTime: PropTypes.bool,
}

// Default props
ChartComponent.defaultProps = {
	backgroundLabel: 'Background Time',
	hasBackgroundTime: true,
}

export default ChartComponent
