import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { getDb } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper for error handling wrapper
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ── USERS ROUTES ────────────────────────────────────────────────────────────

// List all users
app.get("/api/users/list", asyncHandler(async (req: any, res: any) => {
  const db = await getDb();
  const users = await db.all("SELECT * FROM users");
  res.json(users);
}));

// Get user by username
app.get("/api/users/getByUsername", asyncHandler(async (req: any, res: any) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ message: "Username query parameter is required" });
  }
  const db = await getDb();
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  res.json(user || null);
}));

// Create a new user
app.post("/api/users/create", asyncHandler(async (req: any, res: any) => {
  const { username, password, role, fullName, email } = req.body;
  if (!username || !password || !role || !fullName) {
    return res.status(400).json({ message: "Username, password, role, and fullName are required" });
  }

  const db = await getDb();
  const existing = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  if (existing) {
    return res.status(400).json({ message: `Username "${username}" already exists` });
  }

  const _id = crypto.randomUUID();
  await db.run(
    "INSERT INTO users (_id, username, password, role, fullName, email, status) VALUES (?, ?, ?, ?, ?, ?, 'Active')",
    [_id, username, password, role, fullName, email || null]
  );
  res.json({ _id });
}));

// Deactivate user
app.post("/api/users/deactivate", asyncHandler(async (req: any, res: any) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "User id is required" });

  const db = await getDb();
  await db.run("UPDATE users SET status = 'Inactive' WHERE _id = ?", [id]);
  res.json({ success: true });
}));

// Reactivate user
app.post("/api/users/reactivate", asyncHandler(async (req: any, res: any) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "User id is required" });

  const db = await getDb();
  await db.run("UPDATE users SET status = 'Active' WHERE _id = ?", [id]);
  res.json({ success: true });
}));

// Reset password
app.post("/api/users/resetPassword", asyncHandler(async (req: any, res: any) => {
  const { id, newPassword } = req.body;
  if (!id || !newPassword) {
    return res.status(400).json({ message: "User id and newPassword are required" });
  }
  if (newPassword.trim().length < 4) {
    return res.status(400).json({ message: "Password must be at least 4 characters" });
  }

  const db = await getDb();
  await db.run("UPDATE users SET password = ? WHERE _id = ?", [newPassword.trim(), id]);
  res.json({ success: true });
}));

// Update last login
app.post("/api/users/updateLastLogin", asyncHandler(async (req: any, res: any) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "User id is required" });

  const now = new Date()
    .toISOString()
    .replace("T", " ")
    .slice(0, 16);

  const db = await getDb();
  await db.run("UPDATE users SET lastLogin = ? WHERE _id = ?", [now, id]);
  res.json({ success: true });
}));

// Seed admin (no-op since db.ts already seeds it on database open)
app.post("/api/users/seedAdmin", asyncHandler(async (req: any, res: any) => {
  res.json({ success: true });
}));

// ── CONSUMERS ROUTES ────────────────────────────────────────────────────────

// List all consumers
app.get("/api/consumers/list", asyncHandler(async (req: any, res: any) => {
  const db = await getDb();
  const consumers = await db.all("SELECT * FROM consumers");
  res.json(consumers);
}));

// Get consumer by accountNumber
app.get("/api/consumers/getByAccountNumber", asyncHandler(async (req: any, res: any) => {
  const { accountNumber } = req.query;
  if (!accountNumber) {
    return res.status(400).json({ message: "accountNumber is required" });
  }
  const db = await getDb();
  const consumer = await db.get("SELECT * FROM consumers WHERE accountNumber = ?", [accountNumber]);
  res.json(consumer || null);
}));

// Get consumers by wardId
app.get("/api/consumers/getByWard", asyncHandler(async (req: any, res: any) => {
  const { wardId } = req.query;
  if (!wardId) return res.status(400).json({ message: "wardId is required" });

  const db = await getDb();
  const consumers = await db.all("SELECT * FROM consumers WHERE wardId = ?", [Number(wardId)]);
  res.json(consumers);
}));

// Create consumer
app.post("/api/consumers/create", asyncHandler(async (req: any, res: any) => {
  const { accountNumber, fullName, address, wardId, meterNumber, phoneNumber, email, status } = req.body;
  if (!accountNumber || !fullName || !address || !wardId || !meterNumber) {
    return res.status(400).json({ message: "Missing required consumer fields" });
  }

  const db = await getDb();
  const _id = crypto.randomUUID();
  await db.run(
    "INSERT INTO consumers (_id, accountNumber, fullName, address, wardId, meterNumber, phoneNumber, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [_id, accountNumber, fullName, address, Number(wardId), meterNumber, phoneNumber || null, email || null, status || "Active"]
  );
  res.json(_id); // Returns the new ID as string
}));

// Update consumer
app.post("/api/consumers/update", asyncHandler(async (req: any, res: any) => {
  const { id, status, phoneNumber, email, fullName, address, wardId, meterNumber } = req.body;
  if (!id) return res.status(400).json({ message: "Consumer id is required" });

  const db = await getDb();
  const updates: string[] = [];
  const params: any[] = [];

  if (status !== undefined) {
    updates.push("status = ?");
    params.push(status);
  }
  if (phoneNumber !== undefined) {
    updates.push("phoneNumber = ?");
    params.push(phoneNumber);
  }
  if (email !== undefined) {
    updates.push("email = ?");
    params.push(email);
  }
  if (fullName !== undefined) {
    updates.push("fullName = ?");
    params.push(fullName);
  }
  if (address !== undefined) {
    updates.push("address = ?");
    params.push(address);
  }
  if (wardId !== undefined) {
    updates.push("wardId = ?");
    params.push(Number(wardId));
  }
  if (meterNumber !== undefined) {
    updates.push("meterNumber = ?");
    params.push(meterNumber);
  }

  if (updates.length === 0) {
    return res.json({ success: true, message: "No updates provided" });
  }

  params.push(id);
  await db.run(`UPDATE consumers SET ${updates.join(", ")} WHERE _id = ?`, params);
  res.json({ success: true });
}));

// ── METER READINGS ROUTES ───────────────────────────────────────────────────

// List all readings
app.get("/api/meterReadings/list", asyncHandler(async (req: any, res: any) => {
  const db = await getDb();
  const readings = await db.all("SELECT * FROM meter_readings");
  res.json(readings);
}));

// Get readings by consumerId
app.get("/api/meterReadings/getByConsumer", asyncHandler(async (req: any, res: any) => {
  const { consumerId } = req.query;
  if (!consumerId) return res.status(400).json({ message: "consumerId is required" });

  const db = await getDb();
  const readings = await db.all("SELECT * FROM meter_readings WHERE consumerId = ?", [consumerId]);
  res.json(readings);
}));

// Create reading
app.post("/api/meterReadings/create", asyncHandler(async (req: any, res: any) => {
  const { consumerId, readingDate, previousReading, currentReading, consumption, readBy, notes } = req.body;
  if (!consumerId || !readingDate || previousReading === undefined || currentReading === undefined || consumption === undefined || !readBy) {
    return res.status(400).json({ message: "Missing required reading fields" });
  }

  const db = await getDb();
  const _id = crypto.randomUUID();
  await db.run(
    "INSERT INTO meter_readings (_id, consumerId, readingDate, previousReading, currentReading, consumption, readBy, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [_id, consumerId, readingDate, Number(previousReading), Number(currentReading), Number(consumption), readBy, notes || null]
  );
  res.json(_id);
}));

// ── BILLS ROUTES ────────────────────────────────────────────────────────────

// List all bills, enriched with consumer
app.get("/api/bills/list", asyncHandler(async (req: any, res: any) => {
  const db = await getDb();
  const bills = await db.all("SELECT * FROM bills");
  const enriched = await Promise.all(
    bills.map(async (bill) => {
      const consumer = await db.get("SELECT * FROM consumers WHERE _id = ?", [bill.consumerId]);
      return { ...bill, consumer: consumer || null };
    })
  );
  res.json(enriched);
}));

// Get bills by consumer
app.get("/api/bills/getByConsumer", asyncHandler(async (req: any, res: any) => {
  const { consumerId } = req.query;
  if (!consumerId) return res.status(400).json({ message: "consumerId is required" });

  const db = await getDb();
  const bills = await db.all("SELECT * FROM bills WHERE consumerId = ?", [consumerId]);
  res.json(bills);
}));

// Get bill by billId, enriched with consumer
app.get("/api/bills/getByBillId", asyncHandler(async (req: any, res: any) => {
  const { billId } = req.query;
  if (!billId) return res.status(400).json({ message: "billId is required" });

  const db = await getDb();
  const bill = await db.get("SELECT * FROM bills WHERE billId = ?", [billId]);
  if (bill) {
    const consumer = await db.get("SELECT * FROM consumers WHERE _id = ?", [bill.consumerId]);
    bill.consumer = consumer || null;
  }
  res.json(bill || null);
}));

// Create bill
app.post("/api/bills/create", asyncHandler(async (req: any, res: any) => {
  const { billId, consumerId, billingPeriod, prevReading, currReading, consumption, amountDue, dueDate, status, generatedDate, generatedBy } = req.body;
  if (!billId || !consumerId || !billingPeriod || prevReading === undefined || currReading === undefined || consumption === undefined || amountDue === undefined || !dueDate || !status || !generatedDate || !generatedBy) {
    return res.status(400).json({ message: "Missing required bill fields" });
  }

  const db = await getDb();
  const _id = crypto.randomUUID();
  await db.run(
    "INSERT INTO bills (_id, billId, consumerId, billingPeriod, prevReading, currReading, consumption, amountDue, dueDate, status, generatedDate, generatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [_id, billId, consumerId, billingPeriod, Number(prevReading), Number(currReading), Number(consumption), Number(amountDue), dueDate, status, generatedDate, generatedBy]
  );
  res.json(_id);
}));

// Update bill status
app.post("/api/bills/updateStatus", asyncHandler(async (req: any, res: any) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ message: "Bill id and status are required" });

  const db = await getDb();
  await db.run("UPDATE bills SET status = ? WHERE _id = ?", [status, id]);
  res.json({ success: true });
}));

// ── PAYMENTS ROUTES ─────────────────────────────────────────────────────────

// List all payments, enriched with consumer
app.get("/api/payments/list", asyncHandler(async (req: any, res: any) => {
  const db = await getDb();
  const payments = await db.all("SELECT * FROM payments");
  const enriched = await Promise.all(
    payments.map(async (payment) => {
      const consumer = await db.get("SELECT * FROM consumers WHERE _id = ?", [payment.consumerId]);
      return { ...payment, consumer: consumer || null };
    })
  );
  res.json(enriched);
}));

// Get payments by bill
app.get("/api/payments/getByBill", asyncHandler(async (req: any, res: any) => {
  const { billId } = req.query;
  if (!billId) return res.status(400).json({ message: "billId is required" });

  const db = await getDb();
  const payments = await db.all("SELECT * FROM payments WHERE billId = ?", [billId]);
  res.json(payments);
}));

// Get payments by consumer
app.get("/api/payments/getByConsumer", asyncHandler(async (req: any, res: any) => {
  const { consumerId } = req.query;
  if (!consumerId) return res.status(400).json({ message: "consumerId is required" });

  const db = await getDb();
  const payments = await db.all("SELECT * FROM payments WHERE consumerId = ?", [consumerId]);
  res.json(payments);
}));

// Create payment
app.post("/api/payments/create", asyncHandler(async (req: any, res: any) => {
  const { paymentId, billId, consumerId, amount, paymentDate, paymentMethod, referenceNumber, receivedBy } = req.body;
  if (!paymentId || !billId || !consumerId || amount === undefined || !paymentDate || !paymentMethod || !receivedBy) {
    return res.status(400).json({ message: "Missing required payment fields" });
  }

  const db = await getDb();
  const _id = crypto.randomUUID();
  await db.run(
    "INSERT INTO payments (_id, paymentId, billId, consumerId, amount, paymentDate, paymentMethod, referenceNumber, receivedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [_id, paymentId, billId, consumerId, Number(amount), paymentDate, paymentMethod, referenceNumber || null, receivedBy]
  );
  res.json(_id);
}));

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
