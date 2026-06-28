# Buildathon Registration Portal Frontend

A premium, responsive, dark-neon cyberpunk-themed frontend client built using Vanilla HTML5, CSS3, and ES6 JavaScript. Connects dynamically to the backend API server.

---

## 📂 Folder Structure

```text
frontend/
├── index.html          # Hero, timelines, track modules, accordion FAQs
├── login.html          # Google OAuth ID token exchange gateway
├── register.html       # Profile updating, validations, team creation/joining tabs
├── dashboard.html      # Participant metrics tracker, teammate records database
├── admin.html          # Admin Local authentication & dashboard console
├── qr-pass.html        # Downloadable/printable confirmation entry pass
├── attendance.html     # Check-in attendance scan station
│
├── css/
│   ├── style.css       # Core variables, resets, skeletons, toast alerts
│   ├── home.css        # Landing hero and grid section styles
│   ├── login.css       # Center-aligned credential forms styling
│   ├── register.css    # Multi-step/conditional team action grids
│   ├── dashboard.css   # Milestone tracks, sidebars, tables
│   ├── admin.css       # Admin dashboard, custom modals, stats
│   ├── attendance.css  # Viewing simulated laser scans & details cards
│   └── responsive.css  # Media queries overrides for tablets/mobiles
│
└── js/
    ├── api.js          # Fetch wrapper injecting JWT auth headers automatically
    ├── auth.js         # JWT validators and localStorage gatekeepers
    ├── utils.js        # Button loadings, toast animators, modal hooks
    ├── login.js        # Google authentication & simulation triggers
    ├── register.js     # Form validation constraints, team creator handlers
    ├── dashboard.js    # Metric milestones & teammate tables renderer
    ├── admin.js        # Admin metrics, user lists toggles, searches, approvals
    ├── qr.js           # Passes print and image download handlers
    └── attendance.js   # QR verify scanners and check-in recorders
```

---

## ⚡ Setup & Serving Instructions

Since this is a client utilizing ES6 Modules (`import`/`export`), opening HTML pages directly from the local file system (`file://` protocol) will fail due to CORS security policies on module loading. You **MUST** run the frontend using a local static server.

### Option 1: Live Server (VS Code Extension)
1. Open the project root folder in VS Code.
2. Install the **Live Server** extension by Ritwick Dey.
3. Open `frontend/index.html` and click the **Go Live** button in the status bar (port `5500` by default).

### Option 2: Node.js static server
1. Open terminal and run:
   ```bash
   npm install -g serve
   ```
2. Navigate to the `frontend` directory and serve:
   ```bash
   serve -l 3000
   ```

3. Open `http://localhost:3000` in your browser.

---

## 🔐 Auth Configurations & Developer Bypass

### Google OAuth Requirements
Standard login uses the passport redirect flow. On success, the backend redirects back to the frontend:
`http://localhost:3000/login.html?token=JWT_TOKEN`
Our login script intercepts this token, stores it, and populates the session profiles.

### Offline Developer Test Simulation
If you are developing offline or without configured Google credentials, use the **Offline Test Simulation** drawer at the bottom of the Login Card:
1. Type a username (e.g. `teststudent`).
2. Click **Trigger Test Login**.
3. The client sends a mock request (`mock_teststudent`) which the backend verifies, matches to domain restriction, creates a user, and issues a JWT token.

---

## 🛡️ Administrative Console Credentials
- Navigate to the **Admin Portal** link in the nav bar or open `admin.html`.
- Enter the default administrative credentials:
  - **Email:** `admin@mycollege.edu`
  - **Password:** `AdminSecurePassword123!`
- Once authenticated, you will gain access to user lists, profile review modals, registration status controls (Approve/Reject), and the **Attendance Scanner** console.
