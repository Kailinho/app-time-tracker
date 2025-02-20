let activeDomain = "";
let lastUpdateTime = Date.now();
let websiteUsage = {}; 
const SERVER_URL = "http://localhost:3001/track"; 

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch (error) {
    return null;
  }
};

const sendDataToElectron = () => {
    chrome.storage.local.get("websiteUsage", (data) => {
      if (data && data.websiteUsage) {
        // ✅ Filter websites with more than 120 seconds (2 minutes)
        const filteredData = Object.fromEntries(
          Object.entries(data.websiteUsage).filter(([_, seconds]) => seconds >= 120)
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

const updateWebsiteTime = () => {
  const now = Date.now();
  const elapsedTime = (now - lastUpdateTime) / 1000; // Convert ms to seconds
  lastUpdateTime = now;

  if (activeDomain) {
    websiteUsage[activeDomain] = (websiteUsage[activeDomain] || 0) + elapsedTime;
    console.log(`Tracking ${activeDomain}: +${Math.floor(elapsedTime)} seconds`);

    // ✅ Store data persistently so popup.js can access it
    chrome.storage.local.set({ websiteUsage });
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
    chrome.storage.local.get("websiteUsage", (data) => {
      console.log("Sending data to popup:", data);
      sendResponse(data.websiteUsage || {});
    });
    return true; // Required for async response
  }
});

setInterval(() => {
    console.log("Current website usage data:", websiteUsage);
    chrome.storage.local.get("websiteUsage", (data) => {
      console.log("Saved storage data:", data);
    });
  }, 5000);
  
setInterval(updateWebsiteTime, 5000);

setInterval(sendDataToElectron, 30000);
