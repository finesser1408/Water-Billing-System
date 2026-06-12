import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("meterReadings").collect();
  },
});

export const getByConsumer = query({
  args: { consumerId: v.id("consumers") },
  handler: async (ctx, { consumerId }) => {
    const readings = await ctx.db
      .query("meterReadings")
      .withIndex("by_consumer", (q) => q.eq("consumerId", consumerId))
      .collect();
    return readings;
  },
});

export const create = mutation({
  args: {
    consumerId: v.id("consumers"),
    readingDate: v.string(),
    previousReading: v.number(),
    currentReading: v.number(),
    consumption: v.number(),
    readBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newReadingId = await ctx.db.insert("meterReadings", args);
    return newReadingId;
  },
});
