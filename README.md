# Epworth Local Board — Smart Water Billing System (Aqua Flow)

A responsive, database-driven React Single Page Application (SPA) built for Epworth Local Board to manage consumer accounts, record water meter readings, track payments, generate bills, and oversee system configurations using **Convex** as the backend database layer.

---

## 🛠️ Navigating the System

The project is divided into two parts: the **Frontend** client and the **Backend** database engine.

### 1. The Frontend (`/frontend`)
* Contains the React client application styled with TailwindCSS.
* Uses **TanStack Router** for routing and access permissions, **TanStack Query** for client caching, and **Lucide Icons** for icons.
* Entry point is [main.tsx](file:///c:/Users/Tavonga/Documents/Projects/Water%20Billing%20System/frontend/src/main.tsx) pointing to `index.html`.

**Running locally:**
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 2. The Backend (`/frontend/convex`)
* Uses **Convex** to run reactive serverless database mutations and queries.
* Declares schema structures, indexes, and backend validation code in [schema.ts](file:///c:/Users/Tavonga/Documents/Projects/Water%20Billing%20System/frontend/convex/schema.ts).
* Automatically updates frontend query subscribers when database records change.

**Running Convex Dev Engine (watches schemas/functions and syncs them):**
```bash
cd frontend
npx convex dev
```

---

## 👥 System Roles & Permissions

The system implements Role-Based Access Control (RBAC). When logging in, the application determines which navigation menus you can see and interact with:

| Role | Accessible Views | Key Responsibilities |
| :--- | :--- | :--- |
| **Billing Officer** | Dashboard, Consumer Accounts, Meter Readings, Help | Records periodic water consumption readings for consumers. |
| **Finance Clerk** | Dashboard, Consumer Accounts, Payments, Account Enquiry, Help | Collects water bill payments, checks current balances, and prints statements. |
| **Finance Manager** | Dashboard, Consumer Accounts, Billing, Billing Reports, Collection Reports, Help | Performs cycle billing calculations, views revenue sheets, and exports collection summaries. |
| **System Administrator** | Dashboard, User Management, Tariff Configuration, System Logs, Help | Manages system logins, updates billing rates, and monitors event logs. |

---

## ➕ Creating a New User in the Convex Dashboard

Since authentication checks against the live database, you can create new operators directly from Convex:

1. Locate the terminal running `npx convex dev`.
2. Look for the **Convex Dashboard Link** printed in that terminal (e.g., `https://dashboard.convex.dev/...`). Click to open it in your browser.
3. In the left-hand navigation sidebar, click on **Data** (database browser).
4. Select the **`users`** table from the list.
5. Click the **"Add Document"** button at the top right.
6. Populate the JSON editor with the following properties (ensure spelling is exact):
   ```json
   {
     "username": "johndoe",
     "password": "password123",
     "fullName": "John Doe",
     "role": "Billing Officer"
   }
   ```
   *Note: Set `"role"` to one of the exact strings:* `"Billing Officer"`, `"Finance Clerk"`, `"Finance Manager"`, *or* `"System Administrator"`.
7. Click **"Save Document"**. The new operator will be able to log in immediately on the frontend app using their username and password.

---

## ⚡ Initializing a New Convex Account & Setup

If you are setting up this project on a fresh machine or deploying it to a new Convex database environment, follow these steps to initialize and link a new Convex account:

### 1. Create a Convex Account
1. Go to [convex.dev](https://www.convex.dev/) and click **Sign Up** (you can authenticate using GitHub).
2. Follow the prompt to set up your personal workspace or organization.

### 2. Log In to Convex CLI
In your project terminal, authenticate your local command-line interface with your new account:
```bash
cd frontend
npx convex login
```
*This will open a browser window requesting authorization. Approve it to connect your terminal.*

### 3. Initialize and Link the Project
Initialize the project to configure a new Convex deployment:
```bash
npx convex dev
```
* The CLI will ask: `"What would you like to configure?"` Select **Create a new project**.
* Choose your workspace and project name when prompted.
* This automatically creates your local `.env.local` configuration containing your unique `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` variables, and deploys the schemas/functions to your new database.

### 4. Seed the Database
Once the database environment has synced, you should create a default Administrator account inside the `users` table via the Convex web dashboard (following the *Creating a New User* steps above) so that you can log in and start using the system.

