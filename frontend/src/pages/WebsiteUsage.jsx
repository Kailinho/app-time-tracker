import { useEffect, useState } from 'react'
import ChartComponent from '../components/ChartComponent'
import DataTable from '../components/DataTable'
import ReportToggle from '../components/ReportToggle'

function WebsiteUsage() {
	const [websiteUsage, setWebsiteUsage] = useState(() => {
		// Load previous data from localStorage
		const storedData = localStorage.getItem('websiteUsageData')
		return storedData ? JSON.parse(storedData) : {}
	})
	const [reportPeriod, setReportPeriod] = useState(1)

	// Listen for updates from Electron backend
	useEffect(() => {
		if (window.electron) {
			window.electron.onUpdateWebsiteReport((data) => {
				setWebsiteUsage((prev) => {
					const merged = { ...prev, ...data }
					localStorage.setItem(
						'websiteUsageData',
						JSON.stringify(merged)
					)
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
	 * Processes website tracking data into a format suitable for charts and tables.
	 * - Filters out websites with <10 min usage for all report periods.
	 * - Ensures at least today's data is included if available.
	 * - Aggregates multiple days for weekly/monthly reports.
	 *
	 * @param {object} data - The website tracking data.
	 * @param {number} period - The report period (1 = Daily, 7 = Weekly, 30 = Monthly).
	 * @returns {array} - Processed data.
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
			if (!data[date]) return // Skip missing dates

			Object.entries(data[date]).forEach(([domain, times]) => {
				if (!aggregatedData[domain]) {
					aggregatedData[domain] = {
						name: domain,
						activeTime: 0,
						backgroundTime: 0,
					}
				}

				// Only process correctly formatted data (activeTime, backgroundTime)
				if (
					typeof times === 'object' &&
					times.activeTime !== undefined &&
					times.backgroundTime !== undefined
				) {
					aggregatedData[domain].activeTime += times.activeTime
					aggregatedData[domain].backgroundTime +=
						times.backgroundTime
				}
			})
		})

		return Object.values(aggregatedData)
			.filter((entry) => entry.activeTime + entry.backgroundTime >= 600) // Exclude websites with <10 min for ALL periods
			.map((entry) => ({
				name: entry.name,
				activeTime: entry.activeTime / 60, // Convert seconds to minutes
				backgroundTime: entry.backgroundTime / 60,
				activeTimeLabel: formatTimeHHMM(entry.activeTime),
				backgroundTimeLabel: formatTimeHHMM(entry.backgroundTime),
			}))
	}

	//  Generate chart data from `websiteUsage`
	const websiteChartData = getChartData(websiteUsage, reportPeriod)

	return (
		<div className='p-6 flex flex-col gap-6 h-full'>
			<div className='flex items-center justify-between mb-2'>
				<h1 className='text-3xl font-bold'>Website Usage</h1>
				<ReportToggle
					reportPeriod={reportPeriod}
					setReportPeriod={setReportPeriod}
				/>
			</div>
			<ChartComponent
				data={websiteChartData}
				activeLabel='Active Time'
				backgroundLabel='Background Time'
				hasBackgroundTime={false}
			/>
			<DataTable data={websiteChartData} />
		</div>
	)
}

export default WebsiteUsage
