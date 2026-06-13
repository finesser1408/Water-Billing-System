import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    password: v.string(), // In production, this should be hashed
    role: v.string(), // "Billing Officer", "Finance Clerk", "Finance Manager", "System Administrator"
    fullName: v.string(),
    email: v.optional(v.string()),
    status: v.optional(v.string()), // "Active", "Inactive"
    lastLogin: v.optional(v.string()),
  }).index("by_username", ["username"]),

  consumers: defineTable({
    accountNumber: v.string(),
    fullName: v.string(),
    address: v.string(),
    wardId: v.number(),
    meterNumber: v.string(),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.string(), // "Active", "Inactive", "Disconnected"
  }).index("by_account", ["accountNumber"])
    .index("by_ward", ["wardId"]),

  meterReadings: defineTable({
    consumerId: v.id("consumers"),
    readingDate: v.string(),
    previousReading: v.number(),
    currentReading: v.number(),
    consumption: v.number(),
    readBy: v.string(), // username of the person who recorded the reading
    notes: v.optional(v.string()),
  }).index("by_consumer", ["consumerId"])
    .index("by_date", ["readingDate"]),

  bills: defineTable({
    billId: v.string(),
    consumerId: v.id("consumers"),
    billingPeriod: v.string(),
    prevReading: v.number(),
    currReading: v.number(),
    consumption: v.number(),
    amountDue: v.number(),
    dueDate: v.string(),
    status: v.string(), // "Unpaid", "Partially Paid", "Paid", "Overdue"
    generatedDate: v.string(),
    generatedBy: v.string(), // username
  }).index("by_consumer", ["consumerId"])
    .index("by_status", ["status"])
    .index("by_bill_id", ["billId"]),

  payments: defineTable({
    paymentId: v.string(),
    billId: v.id("bills"),
    consumerId: v.id("consumers"),
    amount: v.number(),
    paymentDate: v.string(),
    paymentMethod: v.string(), // "Cash", "EcoCash", "OneMoney"
    referenceNumber: v.optional(v.string()),
    receivedBy: v.string(), // username
  }).index("by_bill", ["billId"])
    .index("by_consumer", ["consumerId"])
    .index("by_payment_id", ["paymentId"]),
});
