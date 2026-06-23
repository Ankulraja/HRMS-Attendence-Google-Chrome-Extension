// HRMS Auto Login Content Script
console.log("HRMS Auto Login content script loaded.");

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

function attemptMarkPresent() {
  chrome.storage.local.get(['autoMarkPresent', 'enabled'], (data) => {
    const isEnabled = data.enabled !== false;
    const autoMarkPresent = data.autoMarkPresent !== false;

    if (!isEnabled || !autoMarkPresent) {
      console.log("HRMS Auto Login: Auto Mark Present is disabled or extension is disabled.");
      return;
    }

    console.log("HRMS Auto Login: Auto Mark Present enabled. Checking for button...");

    let attempts = 0;
    const maxAttempts = 50; // 10 seconds total
    const interval = setInterval(() => {
      const markPresentBtn = document.querySelector('#btnmarkpresent');
      if (markPresentBtn) {
        clearInterval(interval);
        console.log("HRMS Auto Login: Clicking 'Mark Present' button...");
        markPresentBtn.click();
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
      attemptMarkPresent();
      return;
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
            googleBtn.click();
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

// Run the script check
if (document.readyState === "complete" || document.readyState === "interactive") {
  attemptAutoLogin();
} else {
  document.addEventListener("DOMContentLoaded", attemptAutoLogin);
}
