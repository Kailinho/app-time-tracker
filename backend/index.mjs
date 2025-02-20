import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { activeWindow, openWindows } from "active-win";
import fs from "fs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "usageData.json"); // ✅ File to store usage history

let mainWindow;

// ✅ Load saved usage data from file (if exists)
const loadUsageData = () => {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  return {};
};

// ✅ Save usage data to file
const saveUsageData = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(appUsage, null, 2));
};

let appUsage = loadUsageData(); // ✅ Load existing usage data

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
    openAtLogin: true, // Start app at boot
    path: process.execPath, // Path to the executable
  });
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});


const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD format
};

let lastUpdateTime = Date.now();


setInterval(async () => {
  try {
    const allWindows = await openWindows();
    const activeWin = await activeWindow();
    const currentTime = Date.now();
    const elapsedTime = (currentTime - lastUpdateTime) / 1000;
    lastUpdateTime = currentTime;

    const today = getCurrentDate();
    if (!appUsage.history) appUsage.history = {};
    if (!appUsage.history[today]) appUsage.history[today] = {};


    allWindows.forEach(win => {
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
