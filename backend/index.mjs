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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "usageData.json"); // ✅ App usage data file
const WEBSITE_USAGE_FILE = path.join(__dirname, "websiteUsage.json"); // ✅ Website tracking data file

let mainWindow;
const appUsage = loadUsageData();
const websiteUsage = loadWebsiteData();

// ✅ Load app usage data from file
function loadUsageData() {
  return fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) : { history: {} };
}

// ✅ Load website tracking data from file
function loadWebsiteData() {
  return fs.existsSync(WEBSITE_USAGE_FILE) ? JSON.parse(fs.readFileSync(WEBSITE_USAGE_FILE, "utf8")) : {};
}

// ✅ Save app usage data
function saveUsageData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(appUsage, null, 2));
}

// ✅ Save website tracking data
function saveWebsiteData() {
  fs.writeFileSync(WEBSITE_USAGE_FILE, JSON.stringify(websiteUsage, null, 2));
}

// ✅ Ensure Electron is Ready Before Initializing Express
app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:5173");

  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
  });

  // ✅ Start Express Server After Electron is Ready
  startExpressServer();
});

// ✅ Quit app when all windows are closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ✅ Format time (HH:MM:SS)
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// ✅ Get current date in YYYY-MM-DD format
const getCurrentDate = () => new Date().toISOString().split("T")[0];

let lastUpdateTime = Date.now();

// ✅ Track Active and Background App Usage Every Second
setInterval(async () => {
  try {
    const allWindows = await openWindows();
    const activeWin = await activeWindow();
    const currentTime = Date.now();
    const elapsedTime = (currentTime - lastUpdateTime) / 1000; // Convert ms to seconds
    lastUpdateTime = currentTime;

    const today = getCurrentDate();
    if (!appUsage.history[today]) appUsage.history[today] = {};

    allWindows.forEach((win) => {
      const appName = win.owner.name || "Unknown";
      if (!appUsage.history[today][appName]) {
        appUsage.history[today][appName] = { activeTime: 0, backgroundTime: 0 };
      }

      if (activeWin && win.id === activeWin.id) {
        appUsage.history[today][appName].activeTime += elapsedTime;
      } else {
        appUsage.history[today][appName].backgroundTime += elapsedTime;
      }
    });

    saveUsageData();

    if (mainWindow) {
      mainWindow.webContents.send("update-usage-report", appUsage.history);
    }
  } catch (error) {
    console.error("Error fetching windows:", error);
  }
}, 1000);

// ✅ Start Express Server (Runs After Electron is Ready)
function startExpressServer() {
  const expressApp = express();
  const PORT = 3001;

  expressApp.use(cors());
  expressApp.use(express.json());

  // ✅ Receive Website Tracking Data from Browser Extension
  expressApp.post("/track", (req, res) => {
    console.log("Received website tracking data:", req.body);

    const today = getCurrentDate();
    if (!websiteUsage[today]) websiteUsage[today] = {};

    Object.entries(req.body).forEach(([domain, seconds]) => {
      if (seconds >= 120) { // ✅ Only track websites used for more than 2 minutes
        websiteUsage[today][domain] = (websiteUsage[today][domain] || 0) + seconds;
      }
    });

    saveWebsiteData();
    res.json({ message: "Website data saved successfully!" });

    // ✅ Send updated website data to the frontend
    if (mainWindow) {
      mainWindow.webContents.send("update-website-report", websiteUsage);
    }
  });

  // ✅ Start Express Server
  expressApp.listen(PORT, () => {
    console.log(`Electron backend listening on port ${PORT}`);
  });
}
