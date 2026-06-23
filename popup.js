// HRMS Auto Login Popup Handler

document.addEventListener('DOMContentLoaded', async () => {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const enabledInput = document.getElementById('enabled');
  const autoSubmitInput = document.getElementById('autoSubmit');
  const tryGoogleFirstInput = document.getElementById('tryGoogleFirst');
  const autoMarkPresentInput = document.getElementById('autoMarkPresent');
  const saveBtn = document.getElementById('btnSave');
  const statusMsg = document.getElementById('statusMsg');

  // Load saved settings on popup load
  try {
    const data = await chrome.storage.local.get(['username', 'password', 'enabled', 'autoSubmit', 'tryGoogleFirst', 'autoMarkPresent']);
    
    if (data.username) {
      usernameInput.value = data.username;
    }
    if (data.password) {
      passwordInput.value = data.password;
    }
    
    // Default 'enabled' and 'tryGoogleFirst' to true if not defined yet
    enabledInput.checked = data.enabled !== false;
    tryGoogleFirstInput.checked = data.tryGoogleFirst !== false;
    autoSubmitInput.checked = data.autoSubmit === true;
    autoMarkPresentInput.checked = data.autoMarkPresent !== false;
  } catch (err) {
    console.error("HRMS Auto Login: Error retrieving stored settings:", err);
  }

  // Save settings on button click
  saveBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const enabled = enabledInput.checked;
    const tryGoogleFirst = tryGoogleFirstInput.checked;
    const autoSubmit = autoSubmitInput.checked;
    const autoMarkPresent = autoMarkPresentInput.checked;

    try {
      await chrome.storage.local.set({
        username,
        password,
        enabled,
        tryGoogleFirst,
        autoSubmit,
        autoMarkPresent
      });

      // Show animated success message
      statusMsg.textContent = "Settings saved successfully!";
      statusMsg.style.color = "#10b981"; // Emerald green
      statusMsg.classList.add('show');

      // Hide message after 2 seconds
      setTimeout(() => {
        statusMsg.classList.remove('show');
      }, 2000);
    } catch (err) {
      console.error("HRMS Auto Login: Error saving settings:", err);
      statusMsg.textContent = "Failed to save settings.";
      statusMsg.style.color = "#ef4444"; // Rose red
      statusMsg.classList.add('show');
      
      setTimeout(() => {
        statusMsg.classList.remove('show');
      }, 2000);
    }
  });
});
