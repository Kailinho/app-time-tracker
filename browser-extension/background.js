let activeDomain = "";
let lastUpdateTime = Date.now();
let websiteUsage = {};
const SERVER_URL = "http://localhost:3001/track";

/**
 * Gets the current date in YYYY-MM-DD format based on the user's local timezone.
 * This ensures that tracking data aligns with the user's local time.
 * @returns {string} - The current date in local time.
 */
const getCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString("en-CA"); // Format: YYYY-MM-DD
};

// Store the last recorded date to detect day changes
let lastRecordedDate = getCurrentDate();

// Load stored data from `chrome.storage.local` on startup
chrome.storage.local.get(["websiteUsage", "lastRecordedDate"], (data) => {
  if (data.websiteUsage) {
    websiteUsage = data.websiteUsage;
    console.log("Loaded saved website usage data:", websiteUsage);
  }

  if (data.lastRecordedDate) {
    lastRecordedDate = data.lastRecordedDate;
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
 * Checks if midnight has passed and resets website tracking data if necessary.
 */
const checkForMidnightReset = () => {
  const currentDate = getCurrentDate();

  if (currentDate !== lastRecordedDate) {
    console.log("Midnight detected. Resetting website usage data.");

    websiteUsage = {}; // Reset tracking data
    lastRecordedDate = currentDate; // Update last recorded date

    // Save the reset data to Chrome storage
    chrome.storage.local.set({ websiteUsage, lastRecordedDate }, () => {
      console.log("Website usage data reset successfully.");
    });
  }
};

/**
 * Updates the website usage time for the currently active domain.
 * Ensures that time is not duplicated and persists the updated usage data.
 */
const updateWebsiteTime = () => {
  checkForMidnightReset(); // Ensure data resets at midnight

  const now = Date.now();
  const elapsedTime = (now - lastUpdateTime) / 1000; // Convert ms to seconds
  lastUpdateTime = now;

  if (!activeDomain) return;

  chrome.storage.local.get("websiteUsage", (data) => {
    let storedData = data.websiteUsage || {};

    // Accumulate elapsed time for the currently active domain
    storedData[activeDomain] = (storedData[activeDomain] || 0) + elapsedTime;

    // Save the updated usage data
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
 * Electron will categorize active vs. background time.
 */
const sendDataToElectron = () => {
  checkForMidnightReset(); // Ensure data resets before sending

  chrome.storage.local.get("websiteUsage", (data) => {
    if (data && data.websiteUsage) {
      console.log("📤 Attempting to send website tracking data to Electron:", data.websiteUsage);

      fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.websiteUsage),
      })
        .then((res) => res.json())
        .then((response) => console.log("✅ Successfully sent data to Electron:", response))
        .catch((error) => console.error("❌ Error sending data to Electron:", error));
    } else {
      console.log("⚠️ No website data available to send.");
    }
  });
};


// Periodically check for midnight reset every minute
setInterval(checkForMidnightReset, 60000);

// Update website usage time every 15 seconds
setInterval(updateWebsiteTime, 15000);

// Send website usage data to Electron every 15 seconds
setInterval(sendDataToElectron, 15000);