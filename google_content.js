// HRMS Auto Login - Google Account Selection Content Script
console.log("HRMS Auto Login Google script loaded.");

function selectAccount() {
  chrome.storage.local.get(['username', 'enabled', 'tryGoogleFirst'], (data) => {
    const isEnabled = data.enabled !== false;
    const tryGoogleFirst = data.tryGoogleFirst !== false;
    const targetEmail = (data.username || 'ankul.patel@indiamart.com').trim();

    if (!isEnabled || !tryGoogleFirst || !targetEmail) {
      return;
    }

    console.log("HRMS Auto Login: Looking for Google account:", targetEmail);

    let attempts = 0;
    const maxAttempts = 25; // 5 seconds maximum
    const interval = setInterval(() => {
      // Step 1: Search by data-email attribute
      let accountEl = document.querySelector(`[data-email="${targetEmail}"]`);

      // Step 2: Search by exact text content in leaf elements
      if (!accountEl) {
        const elements = Array.from(document.querySelectorAll('div, span, p, li, [data-email]'));
        accountEl = elements.find(el => {
          if (el.getAttribute('data-email') === targetEmail) return true;
          const text = el.textContent ? el.textContent.trim() : '';
          return text === targetEmail;
        });
      }

      // Step 3: Search for any leaf node elements containing the email text
      if (!accountEl) {
        const elements = Array.from(document.querySelectorAll('div, span, p, li'));
        accountEl = elements.find(el => {
          const text = el.textContent ? el.textContent.trim() : '';
          return text.includes(targetEmail) && el.children.length === 0;
        });
      }

      if (accountEl) {
        clearInterval(interval);
        console.log("HRMS Auto Login: Found Google account element. Triggering click...");
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
