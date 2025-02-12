const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  onUpdateUsageReport: (callback) => ipcRenderer.on("update-usage-report", (_, data) => callback(data)),
});
