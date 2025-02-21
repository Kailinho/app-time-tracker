/**
 * Handles the loading of stored website usage data when the extension popup is opened.
 * Filters and displays only websites that were active for more than 2 minutes.
 */
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("websiteUsage", (data) => {
    const tableBody = document.querySelector("#usageTable tbody");
    tableBody.innerHTML = ""; // Clear existing table content

    if (data && data.websiteUsage) {
      Object.entries(data.websiteUsage)
        .filter(([_, seconds]) => seconds >= 120) // Only display websites used for more than 2 minutes
        .forEach(([domain, seconds]) => {
          // Create a new row for each tracked website
          const row = document.createElement("tr");
          row.innerHTML = `<td>${domain}</td><td>${Math.floor(seconds / 60)} min</td>`;
          tableBody.appendChild(row);
        });
    }
  });
});
