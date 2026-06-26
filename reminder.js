// WFH Attendance Reminder Popup Client

function getTodayDateStringIST() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const btnOpenHRMS = document.getElementById('btnOpenHRMS');
  const btnSkipToday = document.getElementById('btnSkipToday');

  btnOpenHRMS.addEventListener('click', () => {
    console.log("[Reminder Popup] User selected: Open HRMS");
    // Notify background worker to open the page
    chrome.runtime.sendMessage({ action: "openHRMSFromReminder" }, () => {
      window.close(); // Close the popup window
    });
  });

  btnSkipToday.addEventListener('click', async () => {
    console.log("[Reminder Popup] User selected: Skip Today");
    const todayDateString = getTodayDateStringIST();
    // Update local storage to disable alerts for today
    try {
      await chrome.storage.local.set({ skipReminderDate: todayDateString });
      // Notify background worker to clear alarms
      chrome.runtime.sendMessage({ action: "skipTodayFromReminder" }, () => {
        window.close(); // Close the popup window
      });
    } catch (err) {
      console.error("[Reminder Popup] Error skipping reminder:", err);
      window.close();
    }
  });
});
