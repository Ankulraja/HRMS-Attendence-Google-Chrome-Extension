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

function getTodayDateStringIST() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getISTDayOfWeek() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  return istDate.getDay();
}

function isWithinWorkHours() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  
  const minutes = istDate.getHours() * 60 + istDate.getMinutes();
  const start = 8 * 60;   // 08:00 IST
  const end = 19 * 60;    // 19:00 IST
  return minutes >= start && minutes <= end;
}

// Check and open portal if all conditions match (WFH, Work Hours, not opened, not marked, not skipped today)
async function checkAndTriggerAttendance() {
  console.log("[Reminder Check] Starting checkAndTriggerAttendance...");
  try {
    const data = await chrome.storage.local.get([
      'wfhDays',
      'enabled',
      'lastHRMSOpenDate',
      'lastMarkPresentDate',
      'skipReminderDate',
      'reminderCount',
      'lastReminderResetDate'
    ]);

    console.log("[Reminder Check] Storage data retrieved:", JSON.stringify(data));

    const isEnabled = data.enabled !== false;
    if (!isEnabled) {
      console.log("HRMS Auto Login: Extension is disabled. Skipping check.");
      return;
    }

    const todayDateString = getTodayDateStringIST();
    
    // Reset reminder count if it's a new day
    let currentReminderCount = data.reminderCount || 0;
    if (data.lastReminderResetDate !== todayDateString) {
      console.log(`[Reminder Check] New day detected (last reset: ${data.lastReminderResetDate}, today: ${todayDateString}). Resetting reminderCount.`);
      currentReminderCount = 0;
      await chrome.storage.local.set({
        reminderCount: 0,
        lastReminderResetDate: todayDateString
      });
    }

    const lastHRMSOpen = data.lastHRMSOpenDate || "";
    const lastMark = data.lastMarkPresentDate || "";
    const skipDate = data.skipReminderDate || "";

    if (lastMark === todayDateString) {
      console.log(`HRMS Auto Login: Attendance already marked today (${todayDateString}). Skipping check.`);
      return;
    }

    if (skipDate === todayDateString) {
      console.log(`HRMS Auto Login: Reminders skipped for today (${todayDateString}). Skipping check.`);
      return;
    }

    const configuredDays = data.wfhDays || [];
    const currentDayIST = getISTDayOfWeek();

    if (!configuredDays.includes(currentDayIST)) {
      console.log(`HRMS Auto Login: Today (IST day ${currentDayIST}) is NOT a WFH day. Skipping check.`);
      return;
    }

    if (!isWithinWorkHours()) {
      console.log(`HRMS Auto Login: Outside work hours (08:00 - 19:00 IST). Skipping check.`);
      return;
    }

    // If HRMS has not been opened yet today, open it and schedule the first alarm
    if (lastHRMSOpen !== todayDateString) {
      console.log(`HRMS Auto Login: Opening portal for the first time today (${todayDateString}).`);
      
      // Save open state
      await chrome.storage.local.set({ lastHRMSOpenDate: todayDateString });
      console.log("[Reminder Check] lastHRMSOpenDate set to today.");
      
      // Clear any existing alarms to avoid overlap
      console.log("[Reminder Check] Clearing any existing alarms...");
      await chrome.alarms.clear("attendance-reminder-check");
      
      // Schedule the first reminder in 1 minute (for testing)
      console.log("[Reminder Check] Creating reminder check alarm for 1 minute from now...");
      chrome.alarms.create("attendance-reminder-check", { delayInMinutes: 1 });
      console.log("[Reminder Check] Alarm create() called successfully.");

      // Verify alarm exists immediately
      const activeAlarms = await chrome.alarms.getAll();
      console.log("[Reminder Check] Verified active alarms list:", JSON.stringify(activeAlarms));
      
      await openPortalPage();
    } else {
      console.log(`HRMS Auto Login: HRMS was already opened today. Waiting for mark present or next reminder.`);
    }
  } catch (error) {
    console.error("[Reminder Check] Error in checkAndTriggerAttendance:", error);
  }
}

let activeReminderTabId = null;

function triggerReminder() {
  console.log("[Reminder] Triggering reminder workflow...");
  
  // Query for existing HRMS tabs
  chrome.tabs.query({ url: ["*://*.savvyhrms.in/*", "*://*.savvyhrms.co.in/*"] }, (tabs) => {
    if (tabs && tabs.length > 0) {
      // Case 1: HRMS tab exists, send a message to show the modal
      const targetTab = tabs[0];
      console.log("[Reminder] Found HRMS tab. Sending showReminderModal message to Tab ID:", targetTab.id);
      
      chrome.tabs.sendMessage(targetTab.id, { action: "showReminderModal" }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("[Reminder] Failed to send message to HRMS tab. Falling back to opening a reminder tab.");
          openReminderTab();
        } else {
          console.log("[Reminder] showReminderModal message delivered successfully.");
          // Focus the tab and its window so the user sees the modal
          chrome.tabs.update(targetTab.id, { active: true });
          if (targetTab.windowId) {
            chrome.windows.update(targetTab.windowId, { focused: true });
          }
        }
      });
    } else {
      // Case 2: HRMS tab does not exist, open reminder page in a new normal tab
      console.log("[Reminder] HRMS tab not found. Opening reminder tab...");
      openReminderTab();
    }
  });
}

function openReminderTab() {
  if (activeReminderTabId !== null) {
    chrome.tabs.get(activeReminderTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        console.log("[Reminder] Previous reminder tab not found. Creating a new one.");
        createReminderTab();
      } else {
        console.log("[Reminder] Existing reminder tab found. Focusing it.");
        chrome.tabs.update(activeReminderTabId, { active: true });
        if (tab.windowId) {
          chrome.windows.update(tab.windowId, { focused: true });
        }
      }
    });
  } else {
    createReminderTab();
  }
}

function createReminderTab() {
  chrome.tabs.create({
    url: chrome.runtime.getURL("reminder.html"),
    active: true
  }, (tab) => {
    if (tab) {
      activeReminderTabId = tab.id;
      console.log("[Reminder] Reminder tab created with ID:", tab.id);
    }
  });
}

// Track when reminder tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeReminderTabId) {
    activeReminderTabId = null;
    console.log("[Reminder] Reminder tab closed.");
  }
});

// Handle periodic reminder checks via alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log(`[onAlarm] Alarm fired: "${alarm.name}"`);
  if (alarm.name === "attendance-reminder-check") {
    try {
      const todayDateString = getTodayDateStringIST();
      const data = await chrome.storage.local.get([
        'enabled',
        'lastMarkPresentDate',
        'skipReminderDate',
        'reminderCount'
      ]);

      console.log("[onAlarm] Storage data retrieved:", JSON.stringify(data));

      const isEnabled = data.enabled !== false;
      const lastMark = data.lastMarkPresentDate || "";
      const skipDate = data.skipReminderDate || "";
      const count = data.reminderCount || 0;

      if (!isEnabled || lastMark === todayDateString || skipDate === todayDateString) {
        console.log(`[onAlarm] Reminder conditions not met (enabled: ${isEnabled}, lastMark: ${lastMark}, skipDate: ${skipDate}). Skipping notification.`);
        return;
      }

      if (count >= 3) {
        console.log("[onAlarm] Maximum reminder count (3) reached. No more reminders today.");
        return;
      }

      const newCount = count + 1;
      await chrome.storage.local.set({ reminderCount: newCount });
      console.log(`[onAlarm] Incrementing reminderCount to ${newCount}. Triggering reminder...`);

      // Trigger the modal or fallback tab
      triggerReminder();

      // Schedule the next alarm in 1 minute if we haven't reached the limit (for testing)
      if (newCount < 3) {
        console.log("[onAlarm] Scheduling next check alarm in 1 minute...");
        chrome.alarms.create("attendance-reminder-check", { delayInMinutes: 1 });
      } else {
        console.log("[onAlarm] Maximum reminders reached today. Skipping next alarm creation.");
      }
    } catch (error) {
      console.error("[onAlarm] Error in onAlarm handler:", error);
    }
  }
});

// Listen for messages from reminder popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[onMessage] Message received in background:", JSON.stringify(message));
  if (message.action === "attendanceMarked") {
    console.log("HRMS Auto Login: Received attendanceMarked message. Clearing alarms.");
    chrome.alarms.clear("attendance-reminder-check", (wasCleared) => {
      console.log("[onMessage] Alarm clear callback executed. Was cleared:", wasCleared);
    });
  } else if (message.action === "openHRMSFromReminder") {
    console.log("HRMS Auto Login: Received openHRMSFromReminder message. Opening portal...");
    
    // Close the reminder tab if it's open
    if (activeReminderTabId !== null) {
      chrome.tabs.remove(activeReminderTabId, () => {
        if (chrome.runtime.lastError) console.warn("Error removing reminder tab:", chrome.runtime.lastError.message);
        activeReminderTabId = null;
      });
    }
    
    openPortalPage().then(() => {
      if (sendResponse) sendResponse();
    });
  } else if (message.action === "skipTodayFromReminder") {
    console.log("HRMS Auto Login: Received skipTodayFromReminder message. Clearing alarms.");
    chrome.alarms.clear("attendance-reminder-check", (wasCleared) => {
      console.log("[onMessage] Alarm clear callback executed. Was cleared:", wasCleared);
      
      // Close the reminder tab if it's open
      if (activeReminderTabId !== null) {
        chrome.tabs.remove(activeReminderTabId, () => {
          if (chrome.runtime.lastError) console.warn("Error removing reminder tab:", chrome.runtime.lastError.message);
          activeReminderTabId = null;
        });
      }
      
      if (sendResponse) sendResponse();
    });
  }
});

// Open portal page on browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log("HRMS Auto Login: Browser started. Evaluating attendance triggers...");
  checkAndTriggerAttendance();
});

// Open portal page when user returns to Chrome (focuses any Chrome window)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    console.log("HRMS Auto Login: Chrome window focused. Evaluating attendance triggers...");
    checkAndTriggerAttendance();
  }
});
