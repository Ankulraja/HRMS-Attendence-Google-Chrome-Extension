// HRMS Auto Login Popup Handler

document.addEventListener('DOMContentLoaded', async () => {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const enabledInput = document.getElementById('enabled');
  const autoSubmitInput = document.getElementById('autoSubmit');
  const tryGoogleFirstInput = document.getElementById('tryGoogleFirst');
  const autoMarkPresentInput = document.getElementById('autoMarkPresent');
  const wfhDaysCheckboxes = document.querySelectorAll('.day-checkbox');
  const saveBtn = document.getElementById('btnSave');
  const statusMsg = document.getElementById('statusMsg');

  function updateSaveButtonState() {
    const hasSelection = Array.from(wfhDaysCheckboxes).some(cb => cb.checked);
    saveBtn.disabled = !hasSelection;
  }

  wfhDaysCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateSaveButtonState);
  });

  // Load saved settings on popup load
  try {
    const data = await chrome.storage.local.get(['username', 'password', 'enabled', 'autoSubmit', 'tryGoogleFirst', 'autoMarkPresent', 'wfhDays']);
    
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
    autoMarkPresentInput.checked = data.autoMarkPresent === true;
    
    // Default to Monday-Friday if not defined
    const wfhDays = data.wfhDays || [1, 2, 3, 4, 5];
    wfhDaysCheckboxes.forEach(cb => {
      cb.checked = wfhDays.includes(parseInt(cb.value));
    });
    
    updateSaveButtonState();
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

    const wfhDays = Array.from(wfhDaysCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value));

    try {
      await chrome.storage.local.set({
        username,
        password,
        enabled,
        tryGoogleFirst,
        autoSubmit,
        autoMarkPresent,
        wfhDays
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
