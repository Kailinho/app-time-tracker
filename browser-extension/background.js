let activeDomain = ""; // Stores the currently active website domain
let lastUpdateTime = Date.now(); // Tracks last time update occurred
let websiteUsage = {}; // Stores accumulated website usage data
const SERVER_URL = "http://localhost:3001/track"; // URL for sending data to Electron backend

/**
 * Load stored website usage data from Chrome's local storage on extension startup.
 * This ensures that previously tracked data persists across browser restarts.
 */
chrome.storage.local.get("websiteUsage", (data) => {
  if (data.websiteUsage) {
    websiteUsage = data.websiteUsage;
    console.log("Loaded saved website usage data:", websiteUsage);
  }
});

/**
 * Extracts the domain name from a given URL.
 * @param {string} url - The URL to extract the domain from.
 * @returns {string|null} - The domain name without "www." or null if invalid.
 */
const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch (error) {
    return null;
  }
};

/**
 * Updates the website usage time for the currently active domain.
 * Ensures that time is not duplicated and persists the updated usage data.
 */
const updateWebsiteTime = () => {
  const now = Date.now();
  const elapsedTime = (now - lastUpdateTime) / 1000; // Convert ms to seconds
  lastUpdateTime = now;

  if (!activeDomain) return;

  // Retrieve latest stored website usage data to prevent duplication
  chrome.storage.local.get("websiteUsage", (data) => {
    let storedData = data.websiteUsage || {};

    // Accumulate elapsed time for the currently active domain
    storedData[activeDomain] = (storedData[activeDomain] || 0) + elapsedTime;

    // Save the updated usage data back to Chrome storage
    chrome.storage.local.set({ websiteUsage: storedData }, () => {
      websiteUsage = storedData;
      console.log(`Updated ${activeDomain}: +${Math.floor(elapsedTime)} seconds`);
    });
  });
};

/**
 * Detects when a new tab becomes active and updates the active domain.
 */
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url) {
      updateWebsiteTime();
      activeDomain = getDomain(tab.url);
      console.log(`Switched to: ${activeDomain}`);
    }
  });
});

/**
 * Detects when a tab loads a new page and updates the active domain.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateWebsiteTime();
    activeDomain = getDomain(tab.url);
    console.log(`Page Loaded: ${activeDomain}`);
  }
});

/**
 * Handles messages from `popup.js` to retrieve the current website usage data.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getUsage") {
    chrome.storage.local.get("websiteUsage", (data) => {
      console.log("Sending data to popup:", data);
      sendResponse(data.websiteUsage || {});
    });
    return true; // Ensures async response works properly
  }
});

/**
 * Sends stored website tracking data to the Electron backend at regular intervals.
 * Only sends websites with usage time exceeding 5 minutes (300 seconds).
 */
const sendDataToElectron = () => {
  chrome.storage.local.get("websiteUsage", (data) => {
    if (data && data.websiteUsage) {
      const filteredData = Object.fromEntries(
        Object.entries(data.websiteUsage).filter(([_, seconds]) => seconds >= 300)
      );

      if (Object.keys(filteredData).length > 0) {
        fetch(SERVER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filteredData),
        }).catch((error) => console.error("Error sending data to Electron:", error));
      }
    }
  });
};

// Update website usage time every 30 seconds
setInterval(updateWebsiteTime, 30000);

// Send website usage data to Electron every 30 seconds
setInterval(sendDataToElectron, 30000);
