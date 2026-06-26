// HRMS Auto Login Content Script
console.log("HRMS Auto Login content script loaded.");

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

function setInputValue(element, value) {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function findLoginButton() {
  const btn = document.querySelector('#btnLogin') || document.querySelector('.btn-login') || document.querySelector('button[type="submit"]');
  if (btn) return btn;

  const elements = Array.from(document.querySelectorAll('div, button, input[type="submit"], input[type="button"], a'));
  return elements.find(el => {
    const text = el.textContent ? el.textContent.trim() : '';
    const val = el.value ? el.value.trim() : '';
    return text.toLowerCase() === 'login' || val.toLowerCase() === 'login';
  });
}

function findGoogleLoginButton() {
  const elements = Array.from(document.querySelectorAll('div, a, button, span'));
  return elements.find(el => {
    const text = el.textContent ? el.textContent.trim() : '';
    return text.toLowerCase() === 'login with google';
  });
}

function injectFailureBanner() {
  if (document.getElementById('hrms-auto-login-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'hrms-auto-login-banner';
  banner.style.cssText = `
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #f87171;
    padding: 14px;
    border-radius: 8px;
    margin: 15px 0 20px 0;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    line-height: 1.5;
    text-align: left;
    box-sizing: border-box;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  `;
  banner.innerHTML = `
    <div style="font-weight: 700; color: #ef4444; margin-bottom: 5px; display: flex; align-items: center; gap: 8px;">
      <span style="display:inline-block; width: 8px; height: 8px; border-radius:50%; background:#ef4444; animation: pulse 2s infinite;"></span>
      Google Authentication Failed
    </div>
    <div style="color: #cbd5e1;">
      I am unable to open the HRMS via Google Login. 
      You can fill in your credentials manually below, or click the <strong>HRMS Auto Login</strong> extension icon (🧩) to configure them so I can autofill them automatically from now on.
    </div>
  `;

  // Inject animation keyframes
  if (!document.getElementById('hrms-banner-styles')) {
    const style = document.createElement('style');
    style.id = 'hrms-banner-styles';
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.6; }
      }
    `;
    document.head.appendChild(style);
  }

  // Insert banner before the login form elements
  const userEl = document.querySelector('#txtUserName');
  if (userEl && userEl.form) {
    userEl.form.insertBefore(banner, userEl.form.firstChild);
  } else if (userEl && userEl.parentElement) {
    const parent = userEl.parentElement.parentElement || userEl.parentElement;
    parent.insertBefore(banner, parent.firstChild);
  } else {
    document.body.insertBefore(banner, document.body.firstChild);
  }
}

function handleFallback(usernameVal, passwordVal, isAutoSubmit, isGoogleFailure) {
  if (!usernameVal || !passwordVal) {
    console.log("HRMS Auto Login: Manual fallback credentials not configured.");
    if (isGoogleFailure) {
      injectFailureBanner();
    }
    return;
  }

  // Poll for form inputs to render
  let attempts = 0;
  const maxAttempts = 50; // 10 seconds max
  const interval = setInterval(() => {
    const userEl = document.querySelector('#txtUserName');
    const passEl = document.querySelector('#txtPassword');

    if (userEl && passEl) {
      clearInterval(interval);
      console.log("HRMS Auto Login: Autofilling fallback credentials...");
      setInputValue(userEl, usernameVal);
      setInputValue(passEl, passwordVal);

      if (isAutoSubmit) {
        console.log("HRMS Auto Login: Auto-submit enabled. Clicking login in 500ms...");
        setTimeout(() => {
          const loginBtn = findLoginButton();
          if (loginBtn) {
            loginBtn.click();
          } else {
            console.warn("HRMS Auto Login: Login button not found.");
          }
        }, 500);
      }
    }

    attempts++;
    if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 200);
}

function setupMarkPresentDetection() {
  chrome.storage.local.get(['autoMarkPresent', 'enabled', 'wfhDays'], (data) => {
    const isEnabled = data.enabled !== false;
    if (!isEnabled) {
      console.log("HRMS Auto Login: Extension is disabled. Skipping mark present detection.");
      return;
    }

    const autoMarkPresent = data.autoMarkPresent === true;
    const wfhDays = data.wfhDays || [1, 2, 3, 4, 5];
    
    const todayDateString = getTodayDateStringIST();
    const currentDayIST = getISTDayOfWeek();

    if (!wfhDays.includes(currentDayIST)) {
      console.log(`HRMS Auto Login: Today (IST day ${currentDayIST}) is not a configured WFH day. Skipping mark present.`);
      return;
    }

    console.log("HRMS Auto Login: Polling for 'Mark Present' button to set up detection...");

    let attempts = 0;
    const maxAttempts = 50; // 10 seconds total
    const interval = setInterval(() => {
      const markPresentBtn = document.querySelector('#btnmarkpresent');
      if (markPresentBtn) {
        clearInterval(interval);
        console.log("HRMS Auto Login: 'Mark Present' button (#btnmarkpresent) found. Attaching click listener...");
        
        // Attach listener for both manual and automatic clicks
        markPresentBtn.addEventListener('click', () => {
          chrome.storage.local.set({ lastMarkPresentDate: todayDateString }, () => {
            console.log("HRMS Auto Login: Mark Present clicked. lastMarkPresentDate set to:", todayDateString);
            // Send message to background script to clear any pending alarms
            chrome.runtime.sendMessage({ action: "attendanceMarked" });
          });
        });

        // Trigger automatic click if enabled
        if (autoMarkPresent) {
          console.log("HRMS Auto Login: Auto Mark Present enabled. Clicking button automatically...");
          markPresentBtn.click();
        }
      }
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log("HRMS Auto Login: 'Mark Present' button (#btnmarkpresent) not found.");
      }
    }, 200);
  });
}

function attemptAutoLogin() {
  chrome.storage.local.get(['username', 'password', 'enabled', 'autoSubmit', 'tryGoogleFirst'], (data) => {
    const isEnabled = data.enabled !== false;
    const tryGoogleFirst = data.tryGoogleFirst !== false;
    const isAutoSubmit = data.autoSubmit === true;

    if (!isEnabled) {
      console.log("HRMS Auto Login is disabled in extension settings.");
      return;
    }

    const usernameVal = data.username || '';
    const passwordVal = data.password || '';

    // Check if we are on a login page
    const isLoginPage = !!document.querySelector('#txtUserName');

    if (!isLoginPage) {
      // We are logged in! Clear google login attempt state for next session
      sessionStorage.removeItem('hrms_google_login_state');
      
      // Initialize Mark Present button detection and auto-click if enabled
      setupMarkPresentDetection();
      return;
    }

    // Attach click listener for manual clicks to authorize the account selector
    const googleBtn = findGoogleLoginButton();
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        chrome.storage.local.set({ google_login_initiated: Date.now() });
      });
    }

    // We are on the login page. Check Google login first flow.
    if (tryGoogleFirst) {
      const googleState = sessionStorage.getItem('hrms_google_login_state');

      if (googleState === null) {
        // State 1: Fresh page load, attempt Google sign-in
        console.log("HRMS Auto Login: Initiating Google Login...");
        sessionStorage.setItem('hrms_google_login_state', 'attempting');

        let attempts = 0;
        const interval = setInterval(() => {
          const googleBtn = findGoogleLoginButton();
          if (googleBtn) {
            clearInterval(interval);
            console.log("HRMS Auto Login: Clicking Google Login Button.");
            // Set timestamp to authorize google account selector click
            chrome.storage.local.set({ google_login_initiated: Date.now() }, () => {
              googleBtn.click();
            });
          }
          attempts++;
          if (attempts >= 25) { // 5 seconds timeout
            clearInterval(interval);
            console.warn("HRMS Auto Login: Google Login button not found. Falling back.");
            handleFallback(usernameVal, passwordVal, isAutoSubmit, false);
          }
        }, 200);

      } else if (googleState === 'attempting') {
        // State 2: Returned to login page after Google attempt -> Google login failed
        console.warn("HRMS Auto Login: Redirected back to login. Google login failed.");
        sessionStorage.setItem('hrms_google_login_state', 'failed');
        handleFallback(usernameVal, passwordVal, isAutoSubmit, true);

      } else {
        // State 3: Already failed. Do not click Google Login again to prevent loop. Use fallback.
        console.log("HRMS Auto Login: Google Login failed earlier. Using manual fallback.");
        handleFallback(usernameVal, passwordVal, isAutoSubmit, false);
      }
    } else {
      // Google Login First is disabled. Go straight to credentials fallback.
      handleFallback(usernameVal, passwordVal, isAutoSubmit, false);
    }
  });
}

let activeReminderModalHost = null;

function showReminderModal() {
  console.log("HRMS Auto Login: Showing reminder modal...");
  
  if (activeReminderModalHost) {
    console.log("HRMS Auto Login: Reminder modal is already open.");
    return;
  }

  activeReminderModalHost = document.createElement('div');
  activeReminderModalHost.id = 'hrms-reminder-modal-host';
  activeReminderModalHost.style.position = 'fixed';
  activeReminderModalHost.style.top = '0';
  activeReminderModalHost.style.left = '0';
  activeReminderModalHost.style.width = '100%';
  activeReminderModalHost.style.height = '100%';
  activeReminderModalHost.style.zIndex = '999999';
  document.body.appendChild(activeReminderModalHost);

  const shadow = activeReminderModalHost.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
    }
    
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(11, 15, 25, 0.85);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .overlay.show {
      opacity: 1;
    }
    
    .modal-card {
      width: 420px;
      height: 320px;
      padding: 24px;
      background: radial-gradient(circle at top left, #1e293b, #0f172a, #0b0f19);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #f8fafc;
      font-family: 'Outfit', sans-serif;
      transform: translateY(20px);
      transition: transform 0.3s ease;
    }
    
    .overlay.show .modal-card {
      transform: translateY(0);
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .warning-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(245, 158, 11, 0.1);
      color: #fbbf24;
      font-weight: 600;
      border: 1px solid rgba(245, 158, 11, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .warning-icon {
      font-size: 12px;
    }
    
    .content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, #ffffff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .description {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 12px 0;
      line-height: 1.5;
    }
    
    .warning-message {
      font-size: 13px;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.5;
      background: rgba(255, 255, 255, 0.02);
      padding: 10px 14px;
      border-radius: 8px;
      border-left: 3px solid #fbbf24;
    }
    
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    
    .btn {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      text-align: center;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #3b82f6);
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    
    .btn-primary:hover {
      background: linear-gradient(135deg, #4f46e5, #2563eb);
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
      transform: translateY(-1px);
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #f8fafc;
      border-color: rgba(255, 255, 255, 0.1);
    }
  `;
  shadow.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="header">
        <div class="warning-badge">
          <span class="warning-icon">⚠️</span>
          <span>WFH Attendance Reminder</span>
        </div>
      </div>
      <div class="content">
        <h1 class="title">Action Required</h1>
        <p class="description">Today is configured as your <strong>Work From Home (WFH)</strong> day.</p>
        <p class="warning-message">It looks like you have not marked your attendance on the Savvy HRMS portal yet. Please complete it before continuing your work.</p>
      </div>
      <div class="actions">
        <button id="btnOpenHRMS" class="btn btn-primary">Open HRMS</button>
        <button id="btnSkipToday" class="btn btn-secondary">Skip Today</button>
      </div>
    </div>
  `;
  shadow.appendChild(overlay);

  setTimeout(() => overlay.classList.add('show'), 50);

  const btnOpenHRMS = overlay.querySelector('#btnOpenHRMS');
  const btnSkipToday = overlay.querySelector('#btnSkipToday');

  btnOpenHRMS.addEventListener('click', () => {
    closeReminderModal();
  });

  btnSkipToday.addEventListener('click', async () => {
    const todayDateString = getTodayDateStringIST();
    try {
      await chrome.storage.local.set({ skipReminderDate: todayDateString });
      chrome.runtime.sendMessage({ action: "skipTodayFromReminder" });
    } catch (err) {
      console.error("HRMS Auto Login: Error skipping reminder:", err);
    }
    closeReminderModal();
  });
}

function closeReminderModal() {
  if (activeReminderModalHost) {
    const overlay = activeReminderModalHost.shadowRoot.querySelector('.overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (activeReminderModalHost) {
          activeReminderModalHost.remove();
          activeReminderModalHost = null;
        }
      }, 300);
    } else {
      activeReminderModalHost.remove();
      activeReminderModalHost = null;
    }
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showReminderModal") {
    showReminderModal();
    if (sendResponse) sendResponse({ success: true });
  }
});

// Run the script check
if (document.readyState === "complete" || document.readyState === "interactive") {
  attemptAutoLogin();
} else {
  document.addEventListener("DOMContentLoaded", attemptAutoLogin);
}
