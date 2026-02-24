# Tiller Dashboard — Setup Guide

## Quick Start (Demo Mode)
Open `index.html` in any browser and click **"Load Demo Data"** — no sign-in or setup needed.

---

## Connect to Your Real Tiller Sheet (Google Sign-In)

The app uses **Google OAuth** so you sign in with your own Google account and it reads your private Tiller sheet directly. **No API key. No making the sheet public.**

### One-time setup: Create an OAuth Client ID (~5 minutes)

**Step 1 — Create a Google Cloud project**
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown → **New Project** → give it any name → Create

**Step 2 — Enable Google Sheets API**
1. Go to **APIs & Services → Library**
2. Search **"Google Sheets API"** → Click it → **Enable**

**Step 3 — Configure OAuth consent screen**
1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in:
   - App name: `Tiller Dashboard` (or anything)
   - User support email: your email
   - Developer contact email: your email
4. Click **Save and Continue** through all steps (no scopes or test users needed for personal use)

**Step 4 — Create OAuth Client ID**
1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Under **Authorized JavaScript origins**, click **+ Add URI** and enter the origin shown in the app's setup screen (e.g. `file://` or `http://localhost:PORT`)
5. Click **Create**
6. Copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)

> **Note on `file://` origins:** Google may reject `file://` as an origin. If so, serve the file locally:
> - Python: `python3 -m http.server 8080` in the `tiller-dashboard/` folder, then open `http://localhost:8080`
> - Add `http://localhost:8080` as the authorized origin instead

**Step 5 — Get your Tiller Sheet ID**

From your Tiller Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       This is your Sheet ID
```

**Step 6 — Connect in the app**
1. Open `index.html` (or `http://localhost:8080`)
2. Paste your **Client ID** and **Sheet ID**
3. Click **Sign in with Google** — a Google popup appears
4. Sign in with the Google account that owns the Tiller sheet
5. Grant read-only Sheets access → done!

Your Client ID and Sheet ID are saved in the browser so you only enter them once. Future visits will silently re-authorize.

---

## Tiller Sheet Column Requirements

### Transactions tab
| Column | Notes |
|--------|-------|
| `Date` | Transaction date |
| `Description` | Merchant/payee |
| `Category` | Your category |
| `Account` | Account name |
| `Amount` | Negative = expense, positive = income |
| `Institution` | Bank name (optional) |

### Balance History tab
| Column | Notes |
|--------|-------|
| `Date` | Balance date |
| `Account` | Account name |
| `Balance` | Account balance |
| `Account Type` | e.g. Checking, Savings, Credit Card, 401k, Loan |
| `Institution` | Bank name (optional) |

---

## Troubleshooting

**"Sign-in failed: popup_closed_by_user"**
Allow pop-ups for this page in your browser settings, then try again.

**"Unauthorized JavaScript origin" error in the popup**
Your Client ID's authorized origins don't include the URL you're serving from. Add it in Google Cloud Console → Credentials → your OAuth Client ID → Authorized JavaScript origins.

**"Session expired — please sign in again"**
OAuth tokens last ~1 hour. Just click **Sync** or **Settings → Sign in** to re-authorize.

**Data shows but looks wrong**
- Check your tab names in Settings → Advanced (case-sensitive)
- Make sure row 1 of each tab has the standard Tiller column headers
