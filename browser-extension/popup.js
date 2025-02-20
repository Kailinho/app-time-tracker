document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("websiteUsage", (data) => {
    const tableBody = document.querySelector("#usageTable tbody");
    tableBody.innerHTML = ""; // Clear previous entries

    if (data && data.websiteUsage) {
      Object.entries(data.websiteUsage)
        .filter(([_, seconds]) => seconds >= 120) // ✅ Show only websites active >2 min
        .forEach(([domain, seconds]) => {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${domain}</td><td>${Math.floor(seconds / 60)} min</td>`;
          tableBody.appendChild(row);
        });
    }
  });
});
