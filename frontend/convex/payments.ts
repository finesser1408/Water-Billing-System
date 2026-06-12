import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("payments").collect();
  },
});

export const getByBill = query({
  args: { billId: v.id("bills") },
  handler: async (ctx, { billId }) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();
    return payments;
  },
});

export const getByConsumer = query({
  args: { consumerId: v.id("consumers") },
  handler: async (ctx, { consumerId }) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_consumer", (q) => q.eq("consumerId", consumerId))
      .collect();
    return payments;
  },
});

export const create = mutation({
  args: {
    paymentId: v.string(),
    billId: v.id("bills"),
    consumerId: v.id("consumers"),
    amount: v.number(),
    paymentDate: v.string(),
    paymentMethod: v.string(),
    referenceNumber: v.optional(v.string()),
    receivedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const newPaymentId = await ctx.db.insert("payments", args);
    return newPaymentId;
  },
});
