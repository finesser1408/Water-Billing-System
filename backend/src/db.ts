import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../aquaflow.db");

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await dbInstance.run("PRAGMA foreign_keys = ON;");

  // Create tables if they do not exist
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      _id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      fullName TEXT NOT NULL,
      email TEXT,
      status TEXT DEFAULT 'Active',
      lastLogin TEXT
    );

    CREATE TABLE IF NOT EXISTS consumers (
      _id TEXT PRIMARY KEY,
      accountNumber TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      address TEXT NOT NULL,
      wardId INTEGER NOT NULL,
      meterNumber TEXT NOT NULL,
      phoneNumber TEXT,
      email TEXT,
      status TEXT DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS meter_readings (
      _id TEXT PRIMARY KEY,
      consumerId TEXT NOT NULL,
      readingDate TEXT NOT NULL,
      previousReading REAL NOT NULL,
      currentReading REAL NOT NULL,
      consumption REAL NOT NULL,
      readBy TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(consumerId) REFERENCES consumers(_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bills (
      _id TEXT PRIMARY KEY,
      billId TEXT UNIQUE NOT NULL,
      consumerId TEXT NOT NULL,
      billingPeriod TEXT NOT NULL,
      prevReading REAL NOT NULL,
      currReading REAL NOT NULL,
      consumption REAL NOT NULL,
      amountDue REAL NOT NULL,
      dueDate TEXT NOT NULL,
      status TEXT NOT NULL,
      generatedDate TEXT NOT NULL,
      generatedBy TEXT NOT NULL,
      FOREIGN KEY(consumerId) REFERENCES consumers(_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      _id TEXT PRIMARY KEY,
      paymentId TEXT UNIQUE NOT NULL,
      billId TEXT NOT NULL,
      consumerId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentDate TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      referenceNumber TEXT,
      receivedBy TEXT NOT NULL,
      FOREIGN KEY(billId) REFERENCES bills(_id) ON DELETE CASCADE,
      FOREIGN KEY(consumerId) REFERENCES consumers(_id) ON DELETE CASCADE
    );
  `);

  // Create indices
  await dbInstance.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_consumers_account ON consumers(accountNumber);
    CREATE INDEX IF NOT EXISTS idx_consumers_ward ON consumers(wardId);
    CREATE INDEX IF NOT EXISTS idx_meter_readings_consumer ON meter_readings(consumerId);
    CREATE INDEX IF NOT EXISTS idx_meter_readings_date ON meter_readings(readingDate);
    CREATE INDEX IF NOT EXISTS idx_bills_consumer ON bills(consumerId);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
    CREATE INDEX IF NOT EXISTS idx_bills_bill_id ON bills(billId);
    CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(billId);
    CREATE INDEX IF NOT EXISTS idx_payments_consumer ON payments(consumerId);
    CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(paymentId);
  `);

  // Seed the system admin user
  const admin = await dbInstance.get("SELECT * FROM users WHERE username = ?", ["Ubetthina"]);
  if (!admin) {
    const adminId = crypto.randomUUID();
    await dbInstance.run(
      `INSERT INTO users (_id, username, password, role, fullName, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, "Ubetthina", "Ubetthina123", "System Administrator", "System Administrator", "Active"]
    );
    console.log(`Seeded System Administrator account with ID: ${adminId}`);
  }

  return dbInstance;
}
