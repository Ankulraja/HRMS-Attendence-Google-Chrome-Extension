// HRMS Auto Login - Google Account Selection Content Script
console.log("HRMS Auto Login Google script loaded.");

function findAccount(storedEmail) {
  const elements = Array.from(document.querySelectorAll('div, span, p, li, [data-email]'));
  
  // 1. Try exact match with stored email first if it's set and ends with @indiamart.com
  if (storedEmail && storedEmail.toLowerCase().endsWith('@indiamart.com')) {
    let match = document.querySelector(`[data-email="${storedEmail}"]`);
    if (match) return match;

    match = elements.find(el => {
      if (el.getAttribute('data-email') === storedEmail) return true;
      const text = el.textContent ? el.textContent.trim() : '';
      return text.toLowerCase() === storedEmail.toLowerCase();
    });
    if (match) return match;
  }

  // 2. Try generic matching for any @indiamart.com account via data-email attribute
  for (let el of elements) {
    const dataEmail = el.getAttribute('data-email');
    if (dataEmail && dataEmail.toLowerCase().endsWith('@indiamart.com')) {
      return el;
    }
  }

  // 3. Try generic matching for any @indiamart.com account via text content (regex) in leaf nodes
  const regex = /[a-zA-Z0-9._%+-]+@indiamart\.com/i;
  for (let el of elements) {
    if (el.children.length === 0) {
      const text = el.textContent ? el.textContent.trim() : '';
      if (regex.test(text)) {
        return el;
      }
    }
  }

  return null;
}

function selectAccount() {
  chrome.storage.local.get(['username', 'enabled', 'tryGoogleFirst', 'google_login_initiated'], (data) => {
    const isEnabled = data.enabled !== false;
    const tryGoogleFirst = data.tryGoogleFirst !== false;
    const storedEmail = (data.username || '').trim();
    const initiatedTime = data.google_login_initiated || 0;
    const timeDiff = Date.now() - initiatedTime;

    // Verify the login attempt was initiated from the HRMS portal within the last 30 seconds
    if (!isEnabled || !tryGoogleFirst || timeDiff > 30000) {
      console.log("HRMS Auto Login: Google login not initiated from HRMS portal recently. Skipping selector.");
      return;
    }

    // Consume the handshake flag immediately
    chrome.storage.local.set({ google_login_initiated: 0 });

    console.log("HRMS Auto Login: Searching for @indiamart.com account...");

    let attempts = 0;
    const maxAttempts = 25; // 5 seconds maximum
    const interval = setInterval(() => {
      const accountEl = findAccount(storedEmail);

      if (accountEl) {
        clearInterval(interval);
        console.log("HRMS Auto Login: Found target Google account. Clicking...");
        accountEl.click();
        
        // Fallback click on parent in case the outer element handles click event listeners
        if (accountEl.parentElement && (accountEl.tagName === 'SPAN' || accountEl.tagName === 'DIV')) {
          setTimeout(() => {
            try {
              accountEl.parentElement.click();
            } catch(e) {}
          }, 100);
        }
      }

      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log("HRMS Auto Login: Google account selection search complete.");
      }
    }, 200);
  });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  selectAccount();
} else {
  document.addEventListener("DOMContentLoaded", selectAccount);
}
