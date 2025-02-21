const { contextBridge, ipcRenderer } = require("electron");

/**
 * Expose Electron-specific APIs to the frontend (React app) in a secure way.
 * This prevents direct access to `ipcRenderer` from the frontend and allows
 * communication with the Electron backend via defined methods.
 */
contextBridge.exposeInMainWorld("electron", {
  /**
   * Listen for application usage updates from the Electron backend.
   * @param {function} callback - Function to execute when data is received.
   */
  onUpdateUsageReport: (callback) => ipcRenderer.on("update-usage-report", (_, data) => callback(data)),

  /**
   * Listen for website usage updates from the Electron backend.
   * @param {function} callback - Function to execute when data is received.
   */
  onUpdateWebsiteReport: (callback) => ipcRenderer.on("update-website-report", (_, data) => callback(data)),
});
