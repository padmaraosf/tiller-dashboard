# Tiller Dashboard

Mobile web app that shows your Tiller Google Sheet data in Chrome on iPhone:
net worth, account balances, 30-day cash flow chart, and a button to open the sheet for Tiller Fill.

---

## One-time setup

### 1. Install Node.js
Download from https://nodejs.org (LTS version).

### 2. Google Cloud — OAuth credentials
1. Go to https://console.cloud.google.com/
2. Create a project (or select an existing one).
3. Enable the **Google Sheets API**:
   - APIs & Services → Library → search "Google Sheets API" → Enable
4. Create OAuth credentials:
   - APIs & Services → Credentials → **+ Create Credentials** → OAuth client ID
   - Application type: **Web application**
   - Name: `Tiller Dashboard`
   - Authorized JavaScript origins:
     - `http://localhost:5173`
   - Click **Create** — copy the **Client ID**

### 3. Configure the app
```bash
cd tiller-dashboard
cp .env.example .env
# Edit .env and paste your Client ID:
# VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

### 4. Install & run
```bash
npm install
npm run dev
```

Open **http://localhost:5173** in Chrome on your Mac, or:
- Find your Mac's local IP (System Settings → Wi-Fi → Details)
- Open `http://YOUR_MAC_IP:5173` in Chrome on your iPhone (must be on the same Wi-Fi)

> To access from iPhone, add your Mac's local IP to **Authorized JavaScript origins** in Google Cloud Console, e.g. `http://192.168.1.42:5173`

---

## Using the app

1. **Sign in** with Google (same account that owns the Tiller sheet).
2. **Paste your spreadsheet URL** — found in the address bar when your Tiller sheet is open.
3. **Dashboard** shows:
   - **Net Worth** — sum of all account balances
   - **Cash Flow** — last 30 days: income, expenses, net + daily bar chart
   - **Assets** — accounts with positive balance
   - **Liabilities** — accounts with negative balance (credit cards, loans)
   - **Open Sheet & Fill Tiller** — opens your sheet; click Tiller → Fill All Sheets inside Google Sheets

---

## Tiller sheet requirements

Uses the **standard Tiller Foundation template**:
- Sheet named `Transactions` with columns: Date, Description, Category, Amount, …
- Sheet named `Balance History` with columns: Date, Time, Account, Account #, Institution, Balance, Account ID

If you've renamed these sheets, update the range names in `src/services/sheets.ts` (lines with `'Transactions!A:D'` and `'Balance History!A:G'`).

---

## Build for production (optional)
```bash
npm run build
# Output goes to dist/ — host on any static server (Vercel, Netlify, etc.)
# Add your production URL to Authorized JavaScript origins in Google Cloud Console
```
