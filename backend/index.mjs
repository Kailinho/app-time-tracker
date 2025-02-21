import { createRequire } from "module";
const require = createRequire(import.meta.url);
const electron = require("electron");
const { app, BrowserWindow, ipcMain } = electron;
import path from "path";
import { fileURLToPath } from "url";
import { activeWindow, openWindows } from "active-win";
import express from "express";
import cors from "cors";
import fs from "fs";

// Resolve file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths for storing usage data
const DATA_FILE = path.join(__dirname, "usageData.json"); // Stores application usage data
const WEBSITE_USAGE_FILE = path.join(__dirname, "websiteUsage.json"); // Stores website tracking data

let mainWindow; // Main Electron window
const appUsage = loadUsageData(); // Load saved application usage data
const websiteUsage = loadWebsiteData(); // Load saved website tracking data

/**
 * Load application usage data from the stored JSON file.
 * If the file does not exist, initialize with an empty history object.
 */
function loadUsageData() {
  return fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) : { history: {} };
}

/**
 * Load website tracking data from the stored JSON file.
 * If the file does not exist, initialize with an empty object.
 */
function loadWebsiteData() {
  return fs.existsSync(WEBSITE_USAGE_FILE) ? JSON.parse(fs.readFileSync(WEBSITE_USAGE_FILE, "utf8")) : {};
}

/**
 * Save application usage data to the JSON file.
 */
function saveUsageData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(appUsage, null, 2));
}

/**
 * Save website tracking data to the JSON file.
 */
function saveWebsiteData() {
  fs.writeFileSync(WEBSITE_USAGE_FILE, JSON.stringify(websiteUsage, null, 2));
}

/**
 * Initialize Electron application and create the main window.
 */
app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  // Load the frontend React application
  mainWindow.loadURL("http://localhost:5173");

  // Configure the app to start on system boot
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
  });

  // Start the Express server once Electron is ready
  startExpressServer();
});

/**
 * Quit the application when all windows are closed (except on macOS).
 * macOS applications remain open even when all windows are closed.
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Format time from seconds into HH:MM:SS format.
 * @param {number} seconds - The time in seconds.
 * @returns {string} - The formatted time string.
 */
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

/**
 * Get the current date in YYYY-MM-DD format.
 * @returns {string} - The formatted date string.
 */
const getCurrentDate = () => new Date().toISOString().split("T")[0];

let lastUpdateTime = Date.now();

/**
 * Monitor active and background app usage at 1-second intervals.
 * The script identifies the currently active application and logs its active/background time.
 */
setInterval(async () => {
  try {
    const allWindows = await openWindows(); // Retrieve all open application windows
    const activeWin = await activeWindow(); // Retrieve the currently active window
    const currentTime = Date.now();
    const elapsedTime = (currentTime - lastUpdateTime) / 1000; // Convert milliseconds to seconds
    lastUpdateTime = currentTime;

    const today = getCurrentDate();
    if (!appUsage.history[today]) appUsage.history[today] = {}; // Ensure date exists in usage history

    // Iterate through open applications and track usage time
    allWindows.forEach((win) => {
      const appName = win.owner.name || "Unknown"; // Get application name
      if (!appUsage.history[today][appName]) {
        appUsage.history[today][appName] = { activeTime: 0, backgroundTime: 0 };
      }

      // Determine if the app is active or running in the background
      if (activeWin && win.id === activeWin.id) {
        appUsage.history[today][appName].activeTime += elapsedTime;
      } else {
        appUsage.history[today][appName].backgroundTime += elapsedTime;
      }
    });

    saveUsageData(); // Persist application usage data

    // Send updated usage report to the frontend
    if (mainWindow) {
      mainWindow.webContents.send("update-usage-report", appUsage.history);
    }
  } catch (error) {
    console.error("Error fetching windows:", error);
  }
}, 1000);

/**
 * Start the Express server for handling website tracking data.
 */
function startExpressServer() {
  const expressApp = express();
  const PORT = 3001;

  expressApp.use(cors()); // Enable CORS for cross-origin requests
  expressApp.use(express.json()); // Parse incoming JSON data

  /**
   * Handle incoming website tracking data from the browser extension.
   * This data is stored and sent to the frontend for visualization.
   */
  expressApp.post("/track", (req, res) => {
    console.log("Website tracking data updated");

    const today = getCurrentDate();
    websiteUsage[today] = req.body; // Store received website tracking data

    saveWebsiteData(); // Persist website tracking data
    res.json({ message: "Website data saved successfully!" });

    // Send updated website tracking data to the frontend
    if (mainWindow) {
      mainWindow.webContents.send("update-website-report", websiteUsage);
    }
  });

  // Start the Express server on port 3001
  expressApp.listen(PORT, () => {
    console.log(`Electron backend listening on port ${PORT}`);
  });
}
