import { useEffect, useState } from 'react'
import ChartComponent from '../components/ChartComponent'
import DataTable from '../components/DataTable'
import ReportToggle from '../components/ReportToggle'

/**
 * AppUsage component that tracks application usage statistics.
 */
function AppUsage() {
	const [usageReport, setUsageReport] = useState(() => {
		// Load previous data from localStorage if available
		const storedData = localStorage.getItem('appUsageData')
		return storedData ? JSON.parse(storedData) : {}
	})
	const [reportPeriod, setReportPeriod] = useState(1)

	useEffect(() => {
		if (window.electron) {
			window.electron.onUpdateUsageReport((data) => {
				setUsageReport((prev) => {
					const merged = { ...prev, ...data }
					localStorage.setItem('appUsageData', JSON.stringify(merged))
					return merged
				})
			})
		}
	}, [])

	/**
	 * Formats time in seconds to "HHh MMm" format.
	 * @param {number} seconds - The time in seconds.
	 * @returns {string} - Formatted time string.
	 */
	const formatTimeHHMM = (seconds) => {
		if (!seconds || isNaN(seconds)) return '0h 0m'
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.floor((seconds % 3600) / 60)
		return `${hours}h ${minutes}m`
	}

	/**
	 * Processes app usage data into a format suitable for charts and tables.
	 * @returns {Array} - Processed data.
	 */
	const getChartData = (data, period) => {
		if (!data || Object.keys(data).length === 0) {
			return [] // No data available
		}

		const today = new Date()
		const allDates = Object.keys(data).sort() // Sorted date strings
		let selectedDates = []

		if (period === 1) {
			const todayStr = today.toLocaleDateString('en-CA')
			selectedDates = allDates.includes(todayStr) ? [todayStr] : []
		} else {
			// Get all dates within the last `period` days (including today)
			const periodDates = new Set()
			for (let i = 0; i < period; i++) {
				const d = new Date(today)
				d.setDate(today.getDate() - i)
				periodDates.add(d.toLocaleDateString('en-CA'))
			}
			selectedDates = allDates.filter((date) => periodDates.has(date))
		}

		const aggregatedData = {}

		selectedDates.forEach((date) => {
			Object.entries(data[date] || {}).forEach(([app, times]) => {
				if (!aggregatedData[app]) {
					aggregatedData[app] = {
						name: app,
						activeTime: 0,
						backgroundTime: 0,
					}
				}
				aggregatedData[app].activeTime += times.activeTime || 0
				aggregatedData[app].backgroundTime += times.backgroundTime || 0
			})
		})

		return Object.values(aggregatedData)
			.filter((entry) => entry.activeTime + entry.backgroundTime >= 600) // Filter out apps with <10 min usage
			.map((entry) => ({
				name: entry.name,
				activeTime: entry.activeTime / 60,
				backgroundTime: entry.backgroundTime / 60,
				activeTimeLabel: formatTimeHHMM(entry.activeTime),
				backgroundTimeLabel: formatTimeHHMM(entry.backgroundTime),
			}))
	}

	const appChartData = getChartData(usageReport, reportPeriod)

	return (
		<div className='p-6 flex flex-col gap-6 h-full'>
			<div className='flex items-center justify-between mb-2'>
				<h1 className='text-3xl font-semibold'>App Usage</h1>
				<ReportToggle
					reportPeriod={reportPeriod}
					setReportPeriod={setReportPeriod}
				/>
			</div>
			<ChartComponent
				data={appChartData}
				activeLabel='Active Time'
				backgroundLabel='Background Time'
				hasBackgroundTime={true}
			/>
			<DataTable data={appChartData} />
		</div>
	)
}

export default AppUsage
