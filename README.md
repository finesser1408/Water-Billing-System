# Epworth Local Board — Smart Water Billing System (Aqua Flow)

A responsive, database-driven React Single Page Application (SPA) built for Epworth Local Board to manage consumer accounts, record water meter readings, track payments, generate bills, and oversee system configurations using **Express and SQLite** as the backend database layer.

---

## 🛠️ Navigating the System

The project is divided into two parts: the **Frontend** client and the **Backend** database engine.

### 1. The Frontend (`/frontend`)
* Contains the React client application styled with TailwindCSS.
* Uses **TanStack Router** for routing and access permissions, **TanStack Query** for client caching, and **Lucide Icons** for icons.
* Entry point is [main.tsx](file:///c:/Users/Tavonga/Documents/Projects/Water%20Billing%20System/frontend/src/main.tsx) pointing to `index.html`.

### 2. The Backend (`/backend`)
* Contains the Express API server that serves data and handles business logic.
* Uses **SQLite** via the `sqlite` and `sqlite3` packages for database persistence.
* Declares tables, indices, and database initialization code in [db.ts](file:///c:/Users/Tavonga/Documents/Projects/Water%20Billing%20System/backend/src/db.ts).
* Automatically creates and initializes the local database file `backend/aquaflow.db` on first start.

---

## 🚀 Running Locally

You can launch both the frontend and backend concurrently or run them separately.

### Option A: Running Concurrently (Recommended)
You can start both servers from the `/frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
This starts:
* Express backend server at **`http://localhost:5000`**
* Vite frontend client at **`http://localhost:3000`**

### Option B: Running Separately

**1. Start the Backend Server:**
```bash
cd backend
npm install
npm run dev
```
The backend server runs at **`http://localhost:5000`**.

**2. Start the Frontend client:**
```bash
cd frontend
npm install
npm run dev:vite
```
The frontend client runs at **`http://localhost:3000`**.

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

## 🔑 Seeding & User Management

### 1. Default Administrator Account
On initial startup, the database is automatically seeded with a default System Administrator account. You can log in using these credentials to begin setting up the system:
* **Username:** `Ubetthina`
* **Password:** `Ubetthina123`

### 2. Creating New Users
Once logged in as the System Administrator:
1. Navigate to the **User Management** menu in the sidebar (`/admin/users`).
2. Click **Add User** at the top right.
3. Fill in the operator's details (Username, Full Name, Role, Password).
4. Save the user. They will be able to log in immediately with the role permissions assigned.

