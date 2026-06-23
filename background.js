// HRMS Auto Login Service Worker
console.log("HRMS Auto Login background service worker started.");

async function openPortalPage() {
  try {
    console.log("HRMS Auto Login: Opening portal login page...");
    await chrome.tabs.create({ url: "https://indiamart.savvyhrms.in/savvyhrms/" });
  } catch (err) {
    console.error("HRMS Auto Login: Error opening portal page:", err);
  }
}

// Open setup page on extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("HRMS Auto Login Chrome Extension loaded successfully. Reason:", details.reason);
  if (details.reason === 'install') {
    // Initialize default empty state for WFH days to force setup
    await chrome.storage.local.set({ wfhDays: [] });
    console.log("HRMS Auto Login: First install. Opening setup page...");
    await chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
  }
});

// Open portal page on browser startup ONLY if today is a WFH day
chrome.runtime.onStartup.addListener(() => {
  console.log("HRMS Auto Login: Browser started. Checking WFH days...");
  chrome.storage.local.get(['wfhDays', 'enabled'], async (data) => {
    const isEnabled = data.enabled !== false;
    
    if (!isEnabled) {
      console.log("HRMS Auto Login: Extension is disabled. Skipping startup.");
      return;
    }

    // Default to empty if they haven't configured it yet
    const configuredDays = data.wfhDays || [];
    const currentDay = new Date().getDay();

    if (configuredDays.includes(currentDay)) {
      console.log(`HRMS Auto Login: Today (day ${currentDay}) is a WFH day. Opening portal...`);
      await openPortalPage();
    } else {
      console.log(`HRMS Auto Login: Today (day ${currentDay}) is NOT a WFH day. Skipping startup.`);
    }
  });
});
