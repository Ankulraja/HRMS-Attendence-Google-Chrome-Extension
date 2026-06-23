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

// Open portal page on extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("HRMS Auto Login Chrome Extension loaded successfully. Reason:", details.reason);
  if (details.reason === 'install') {
    await openPortalPage();
  }
});

// Open portal page on browser startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("HRMS Auto Login: Browser started. Opening portal...");
  await openPortalPage();
});
