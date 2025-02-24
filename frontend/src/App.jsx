import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import AppUsage from "./pages/AppUsage";
import WebsiteUsage from "./pages/WebsiteUsage";

function App() {
  return (
    <Router>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-3xl font-bold mb-4">Usage Tracker</h1>

        {/* Navigation Tabs */}
        <div className="flex gap-6 mb-6">
          <Link to="/" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-400">
            App Usage
          </Link>
          <Link to="/websites" className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-400">
            Website Usage
          </Link>
        </div>

        {/* Page Routes */}
        <Routes>
          <Route path="/" element={<AppUsage />} />
          <Route path="/websites" element={<WebsiteUsage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
