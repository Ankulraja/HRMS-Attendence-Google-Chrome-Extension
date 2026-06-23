# HRMS Auto Login Chrome Extension

A Manifest V3 Google Chrome Extension designed to automate the authentication and check-in procedures for the Savvy HRMS portal.

## Features

1. **Direct Portal Loading on Startup**: Automatically opens the HRMS login page when Google Chrome is launched.
2. **Auto Google Sign-In**: Clicks the "Login With Google" button automatically upon page load.
3. **Google Account Selector Automation**: Automatically selects your primary Google account (e.g. `ankul.patel@indiamart.com`) if prompted by the Google account chooser screen.
4. **Fallback Authentication**: If Google login fails, the extension automatically fills and submits your pre-configured manual credentials.
5. **Auto Mark Present**: Automatically clicks the "Mark Present" check-in button once you successfully land on the employee dashboard.
6. **Configuration Panel**: An elegant, glassmorphic settings popup to toggle features (Try Google First, Auto Fill, Auto Submit, Auto Mark Present) and update credentials.

---

## 🚀 Easy Installation Guide (Step-by-Step)

Follow these simple steps to install and start using the extension:

### Step 1: Download the Extension Files
1. Go to the GitHub repository page: [HRMS-Attendence-Google-Chrome-Extension](https://github.com/Ankulraja/HRMS-Attendence-Google-Chrome-Extension).
2. Click the green **Code** button at the top right of the file list.
3. Click **Download ZIP** from the dropdown menu.
4. Locate the downloaded `.zip` file on your computer and extract/unzip it to a folder.

### Step 2: Install the Extension in Google Chrome
1. Open Google Chrome.
2. Navigate to **`chrome://extensions/`** by typing it in the address bar and pressing Enter.
3. Enable **Developer mode** by turning on the toggle switch in the top-right corner of the page.
4. Click the **Load unpacked** button in the top-left corner of the page.
5. In the file picker window, select the folder you extracted in Step 1 (the folder that contains `manifest.json`).

### Step 3: Configure and Use
1. Click the **Extensions** icon (looks like a puzzle piece 🧩) in the top-right corner of the Chrome toolbar.
2. Find **HRMS Auto Login** and click the **Pin** icon next to it so it stays visible on your toolbar.
3. Click the extension icon (the square with the letter **S**) to open the popup.
4. Enter your username (Google email) and password, toggle your desired features, and click **Save Configurations**.
5. Restart your browser or open a new window to watch the auto-login in action!
