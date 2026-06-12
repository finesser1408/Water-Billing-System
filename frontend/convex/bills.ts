import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const bills = await ctx.db.query("bills").collect();
    // Enrich with consumer data
    const enriched = await Promise.all(
      bills.map(async (bill) => {
        const consumer = await ctx.db.get(bill.consumerId);
        return { ...bill, consumer };
      })
    );
    return enriched;
  },
});

export const getByConsumer = query({
  args: { consumerId: v.id("consumers") },
  handler: async (ctx, { consumerId }) => {
    const bills = await ctx.db
      .query("bills")
      .withIndex("by_consumer", (q) => q.eq("consumerId", consumerId))
      .collect();
    return bills;
  },
});

export const getByBillId = query({
  args: { billId: v.string() },
  handler: async (ctx, { billId }) => {
    const bill = await ctx.db
      .query("bills")
      .withIndex("by_bill_id", (q) => q.eq("billId", billId))
      .first();
    if (bill) {
      const consumer = await ctx.db.get(bill.consumerId);
      return { ...bill, consumer };
    }
    return null;
  },
});

export const create = mutation({
  args: {
    billId: v.string(),
    consumerId: v.id("consumers"),
    billingPeriod: v.string(),
    prevReading: v.number(),
    currReading: v.number(),
    consumption: v.number(),
    amountDue: v.number(),
    dueDate: v.string(),
    status: v.string(),
    generatedDate: v.string(),
    generatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const newBillId = await ctx.db.insert("bills", args);
    return newBillId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("bills"),
    status: v.string(),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status });
  },
});
