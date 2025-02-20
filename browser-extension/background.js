let activeDomain = "";
let lastUpdateTime = Date.now();
let websiteUsage = {}; // Store website tracking data in memory

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch (error) {
    return null;
  }
};

const updateWebsiteTime = () => {
  const now = Date.now();
  const elapsedTime = (now - lastUpdateTime) / 1000; // Convert ms to seconds
  lastUpdateTime = now;

  if (activeDomain) {
    websiteUsage[activeDomain] = (websiteUsage[activeDomain] || 0) + elapsedTime;
    console.log(`Tracking ${activeDomain}: +${Math.floor(elapsedTime)} seconds`);
  }
};

// ✅ Track when a new tab becomes active
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url) {
      updateWebsiteTime();
      activeDomain = getDomain(tab.url);
      console.log(`Switched to: ${activeDomain}`);
    }
  });
});

// ✅ Track when a tab updates (e.g., new URL is loaded)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateWebsiteTime();
    activeDomain = getDomain(tab.url);
    console.log(`Page Loaded: ${activeDomain}`);
  }
});

// ✅ Handle requests from `popup.js`
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getUsage") {
    sendResponse(websiteUsage);
  }
});

// ✅ Periodically update usage time every 10 seconds
setInterval(updateWebsiteTime, 10000);
