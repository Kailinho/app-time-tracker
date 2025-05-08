import {
	BrowserRouter as Router,
	useNavigate,
	useLocation,
} from 'react-router-dom'
import AppUsage from './pages/AppUsage'
import WebsiteUsage from './pages/WebsiteUsage'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useEffect } from 'react'

function AppTabs() {
	const navigate = useNavigate()
	const location = useLocation()
	// Determine which tab is active based on the route
	const tab = location.pathname === '/websites' ? 'websites' : 'apps'

	useEffect(() => {
		// Redirect to '/' if route is not recognized
		if (tab !== 'apps' && tab !== 'websites') {
			navigate('/')
		}
	}, [tab, navigate])

	return (
		<Tabs value={tab} className='flex-1 flex flex-col'>
			<TabsList
				className='w-full grid grid-cols-2 rounded-none bg-transparent border-b'
				style={{ borderColor: '#4361EE', padding: 0 }}
			>
				<TabsTrigger
					value='apps'
					onClick={() => navigate('/')}
					className={`rounded-none h-12 text-base font-semibold border-b-2 transition-all
						${tab === 'apps' ? '' : ''}
					`}
					style={
						tab === 'apps'
							? {
									background: '#4361EE',
									color: '#fff',
									borderColor: '#4361EE',
									borderWidth: '2px',
									borderStyle: 'solid',
									borderBottom: '2px solid #4361EE',
									borderRadius: 0,
							  }
							: {
									background: '#fff',
									color: '#4361EE',
									borderColor: '#4361EE',
									borderWidth: '2px',
									borderStyle: 'solid',
									borderBottom: '2px solid #4361EE',
									borderRadius: 0,
							  }
					}
				>
					App Data
				</TabsTrigger>
				<TabsTrigger
					value='websites'
					onClick={() => navigate('/websites')}
					className={`rounded-none h-12 text-base font-semibold border-b-2 transition-all
						${tab === 'websites' ? '' : ''}
					`}
					style={
						tab === 'websites'
							? {
									background: '#4361EE',
									color: '#fff',
									borderColor: '#4361EE',
									borderWidth: '2px',
									borderStyle: 'solid',
									borderBottom: '2px solid #4361EE',
									borderRadius: 0,
							  }
							: {
									background: '#fff',
									color: '#4361EE',
									borderColor: '#4361EE',
									borderWidth: '2px',
									borderStyle: 'solid',
									borderBottom: '2px solid #4361EE',
									borderRadius: 0,
							  }
					}
				>
					Website Data
				</TabsTrigger>
			</TabsList>
			<TabsContent value='apps' className='flex-1 flex flex-col'>
				<AppUsage />
			</TabsContent>
			<TabsContent value='websites' className='flex-1 flex flex-col'>
				<WebsiteUsage />
			</TabsContent>
		</Tabs>
	)
}

function App() {
	return (
		<Router>
			<div className='min-h-screen w-full flex items-center justify-center bg-background text-foreground'>
				<Card className='w-full max-w-3xl flex flex-col bg-background border-none shadow-none'>
					<CardHeader>
						<CardTitle className='text-4xl font-bold text-center text-[#4361EE]'>
							Usage Tracker
						</CardTitle>
					</CardHeader>
					<CardContent className='flex-1 flex flex-col p-0'>
						<AppTabs />
					</CardContent>
				</Card>
			</div>
		</Router>
	)
}

export default App
