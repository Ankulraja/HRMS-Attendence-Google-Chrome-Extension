# HRMS Auto Login Chrome Extension

A Manifest V3 Google Chrome Extension designed to automate the authentication and check-in procedures for the Savvy HRMS portal.

## Features

1. **Direct Portal Loading on Startup**: Automatically opens the HRMS login page when Google Chrome is launched.
2. **Auto Google Sign-In**: Clicks the "Login With Google" button automatically upon page load.
3. **Google Account Selector Automation**: Automatically selects your primary Google account (e.g. `ankul.patel@indiamart.com`) if prompted by the Google account chooser screen.
4. **Fallback Authentication**: If Google login fails, the extension automatically fills and submits your pre-configured manual credentials.
5. **Auto Mark Present**: Automatically clicks the "Mark Present" check-in button once you successfully land on the employee dashboard.
6. **Configuration Panel**: An elegant, glassmorphic settings popup to toggle features (Try Google First, Auto Fill, Auto Submit, Auto Mark Present) and update credentials.

## Files Included

* `manifest.json` - Configuration and permissions mapping.
* `background.js` - Service worker handling browser startup/installation actions.
* `content.js` - Portal page automation script (autofills credentials, handles warning banner).
* `google_content.js` - Account chooser page automation script.
* `popup.html` & `popup.js` - Polished user settings panel.

## Installation (Local Developer Mode)

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the folder containing these files.
6. Pin the extension to your toolbar, click the icon, configure your credentials/preferences, and save.
