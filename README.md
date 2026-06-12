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
