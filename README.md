# P&H Spec Reference App

A searchable specification reference for P&H 4100XPB and 4100C mining shovels.
Features email/password authentication, role-based access, admin invitations, and fuzzy search across 400+ spec records.

---

## Features

- **Secure login** — email + password, Firebase Auth
- **First user = admin** — whoever registers first automatically gets administrator privileges
- **Invite-only registration** — admins generate a one-time invite link to send to new users (valid 7 days)
- **Admin panel** — manage users, promote/demote admin, view and revoke invitations
- **Fuzzy search** — powered by Fuse.js across all spec categories
- **Category filter pills** — quick-filter by Torque Values, Weights, Brake Specs, Dimensions, Part Numbers etc.

---

## Prerequisites

- **Node.js** 18+ and npm
- A **Firebase** project (free Spark plan works)
- A **Netlify** account (free tier works)
- Git repository (GitHub, GitLab etc.)

---

## Step 1 — Firebase Setup

### 1.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → give it a name (e.g. `ph-spec-reference`)
3. Disable Google Analytics (optional) → **Create project**

### 1.2 Enable Email/Password Authentication

1. Left sidebar → **Authentication** → **Get started**
2. **Sign-in method** tab → **Email/Password** → **Enable** → **Save**

### 1.3 Create Firestore Database

1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in production mode** → select your region → **Enable**

### 1.4 Set Firestore Security Rules

Go to **Firestore Database → Rules** tab, replace the contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read their own profile; admins can read all
    match /users/{userId} {
      allow read:  if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && isAdmin();
      // Allow first-time registration (no users yet)
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    // Anyone authenticated can check invitations; only admins create them
    match /invitations/{token} {
      allow read:  if request.auth != null;
      allow create, delete: if request.auth != null && isAdmin();
      // Allow invited user to mark as used
      allow update: if request.auth != null;
    }

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Click **Publish**.

### 1.5 Get Firebase Config

1. Left sidebar → ⚙️ **Project settings** → **Your apps**
2. Click **Web** icon (</>)  → Register app (e.g. `ph-spec-web`) → **Register**
3. Copy the `firebaseConfig` object — you'll need these values

---

## Step 2 — Local Setup

```bash
# Clone your repo / unzip the project
cd specs-app

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local
```

Edit `.env.local` with your Firebase values:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abc123

VITE_APP_URL=http://localhost:5173
```

Run locally:

```bash
npm run dev
```

Open http://localhost:5173 — register the first account (you'll automatically be admin).

---

## Step 3 — Deploy to Netlify

### 3.1 Push to Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ph-spec-app.git
git push -u origin main
```

### 3.2 Connect to Netlify

1. Go to https://app.netlify.com → **Add new site** → **Import an existing project**
2. Connect your GitHub/GitLab account → select your repository
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Deploy site**

### 3.3 Set Environment Variables in Netlify

1. Netlify dashboard → your site → **Site settings** → **Environment variables**
2. Add each variable from your `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_APP_URL` → set to your Netlify domain e.g. `https://ph-spec.netlify.app`
3. **Trigger redeploy** — go to **Deploys** → **Trigger deploy** → **Deploy site**

### 3.4 Add Netlify Domain to Firebase Auth

1. Firebase console → **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain** → enter your Netlify URL (e.g. `ph-spec.netlify.app`)

---

## Step 4 — First Login (Admin Account)

1. Go to your Netlify URL → click **Sign In** → switch to **Create Account**
2. Register with your email and password
3. You are now admin — no invite needed for the first user

---

## How Invitations Work

1. Log in as admin → click **Admin** in the navbar
2. **Invite User** tab → enter email → **Generate Link**
3. Copy the invite link and send it to the new user (email, Slack, etc.)
4. The link format: `https://your-app.netlify.app/register?invite=TOKEN`
5. Invited user clicks the link → registers with their email and password
6. Account is created; invitation is marked as used

**Note:** Links expire after 7 days and are single-use.

---

## Fuzzy Search Tips

The search uses Fuse.js with threshold `0.35` — it's forgiving of typos and partial matches.

| Search example | What it finds |
|---|---|
| `crowd brake` | All crowd brake torques, weights, specs |
| `R41571` | All records with that part number |
| `265 ft` | Any torque value around 265 ft-lb |
| `shipper shaft end play` | Clearance records for shipper shaft |
| `boom point dim` | Boom point assembly dimensions |
| `hoist gearcase oil` | Gear case oil capacity for hoist |

Use the **category pills** or the **filter dropdown** to narrow results further.

---

## Project Structure

```
src/
├── main.jsx                    Entry point
├── App.jsx                     Router and protected routes
├── firebase.js                 Firebase initialisation
├── index.css                   Global styles (dark industrial theme)
├── contexts/
│   └── AuthContext.jsx         Auth state, register, login, invitations
├── data/
│   └── specs.js               All 400+ spec records (editable)
└── components/
    ├── Auth/AuthPage.jsx       Login and register page
    ├── Layout/Navbar.jsx       Top navigation bar
    ├── Dashboard/Dashboard.jsx Fuzzy search + spec table
    └── Admin/AdminPanel.jsx    Invite users, manage roles
```

---

## Adding More Specs

Edit `src/data/specs.js` — each spec is an object with these fields:

```javascript
{
  manual:        '4100XPB',          // or '4100C'
  category:      'Torque Values',    // must match CATEGORIES array
  system:        'Crowd Brake',
  component:     'Brake mounting bolts',
  part_number:   'R41760D1',
  value:         '265 ft-lb',
  value_metric:  '359 N·m',
  condition:     'With tie wire',
  notes:         'Table 5-4',
}
```

Save the file and redeploy.

---

## License

Internal use — P&H Mining Equipment documentation is © Harnischfeger Corporation / Komatsu Mining.
This app is a reference tool only. Always verify specifications against current OEM documentation before performing work.
