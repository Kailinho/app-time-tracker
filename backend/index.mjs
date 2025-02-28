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
 * Gets the current date in YYYY-MM-DD format based on the user's local timezone.
 * This ensures that tracking data aligns with the user's local time.
 * @returns {string} - The current date in local time.
 */
const getCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString("en-CA"); // Format: YYYY-MM-DD
};

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
}, 15000);

/**
 * Start the Express server for handling website tracking data.
 */
/**
 * Start the Express server for handling website tracking data.
 */
function startExpressServer() {
  const expressApp = express();
  const PORT = 3001;

  expressApp.use(cors());
  expressApp.use(express.json());

  /**
   * Handle incoming website tracking data from the browser extension.
   */
  expressApp.post("/track", async (req, res) => {
    const today = getCurrentDate();
    const activeWin = await activeWindow();

    if (!websiteUsage[today]) websiteUsage[today] = {};

    Object.entries(req.body).forEach(([domain, newTime]) => {
      if (!websiteUsage[today][domain]) {
        websiteUsage[today][domain] = { activeTime: 0, backgroundTime: 0, lastRecordedTime: newTime };
        return;
      }

      let lastTime = websiteUsage[today][domain].lastRecordedTime;
      if (isNaN(lastTime)) {
        websiteUsage[today][domain].lastRecordedTime = newTime;
        return;
      }

      let elapsedTime = newTime - lastTime;

      if (elapsedTime > 0 && elapsedTime < 600) {
        const isBrowserActive =
          activeWin &&
          ["chrome", "opera", "brave", "firefox", "edge"].some((name) =>
            activeWin.owner.name.toLowerCase().includes(name)
          );

        if (isBrowserActive) {
          websiteUsage[today][domain].activeTime += elapsedTime;
          console.log(`📊 ${domain}: +${Math.floor(elapsedTime)}s Active time`);
        } else {
          websiteUsage[today][domain].backgroundTime += elapsedTime;
          console.log(`📊 ${domain}: +${Math.floor(elapsedTime)}s Background time`);
        }

        websiteUsage[today][domain].lastRecordedTime = newTime;
      }
    });

    saveWebsiteData();

    if (mainWindow) {
      mainWindow.webContents.send("update-website-report", websiteUsage);
    }

    res.json({ message: "Website data processed and sent to Electron." });
  });

  expressApp.listen(PORT, () => {
    console.log(`Electron backend listening on port ${PORT}`);
  });
}
