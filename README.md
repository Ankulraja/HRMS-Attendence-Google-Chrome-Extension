# HRMS Auto Login Chrome Extension

A Manifest V3 Google Chrome Extension designed to automate the authentication and check-in procedures for the Savvy HRMS portal.

---

## 🛠️ Step-by-Step Installation

```mermaid
graph TD
    A["1. Download ZIP from GitHub"] --> B["2. Extract ZIP to a folder"]
    B --> C["3. Open chrome://extensions/ in Chrome"]
    C --> D["4. Turn ON 'Developer mode' (top-right)"]
    D --> E["5. Click 'Load unpacked' & select folder"]
    E --> F["6. Pin the extension & Save credentials!"]

    style A fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    style D fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    style E fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    style F fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

---

## 🔄 How the Automation Works

The extension works automatically while keeping your Google Sign-in on other websites completely secure using a 30-second handshake protocol:

```mermaid
flowchart TD
    Start["🚀 Chrome Opens / Startup"] --> OpenPortal["🌐 Opens Savvy HRMS Login Page"]
    OpenPortal --> ClickGoogle["🔘 Auto Clicks 'Login with Google'"]
    ClickGoogle --> Handshake["🔑 Sets 30s Secure Handshake Flag"]
    Handshake --> RedirectGoogle["🖥️ Redirects to accounts.google.com"]

    RedirectGoogle --> Choice{Chooser Screen?}
    Choice -- Yes --> CheckHandshake{Handshake Valid?}
    Choice -- No --> Dashboard

    CheckHandshake -- Yes < 30s --> AutoClickEmail["✅ Auto Selects *@indiamart.com Account"]
    CheckHandshake -- No / Expired --> UserManualChoice["👤 User Selects Account Manually"]

    AutoClickEmail --> Dashboard["📈 Redirects to HRMS Dashboard"]
    Dashboard --> ClickPresent["🎯 Auto Clicks 'Mark Present' Check-in"]

    style AutoClickEmail fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style ClickPresent fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style UserManualChoice fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```
