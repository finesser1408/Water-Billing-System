import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("consumers").collect();
  },
});

export const getByAccountNumber = query({
  args: { accountNumber: v.string() },
  handler: async (ctx, { accountNumber }) => {
    const consumer = await ctx.db
      .query("consumers")
      .withIndex("by_account", (q) => q.eq("accountNumber", accountNumber))
      .first();
    return consumer;
  },
});

export const getByWard = query({
  args: { wardId: v.number() },
  handler: async (ctx, { wardId }) => {
    const consumers = await ctx.db
      .query("consumers")
      .withIndex("by_ward", (q) => q.eq("wardId", wardId))
      .collect();
    return consumers;
  },
});

export const create = mutation({
  args: {
    accountNumber: v.string(),
    fullName: v.string(),
    address: v.string(),
    wardId: v.number(),
    meterNumber: v.string(),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const newConsumerId = await ctx.db.insert("consumers", args);
    return newConsumerId;
  },
});

export const update = mutation({
  args: {
    id: v.id("consumers"),
    status: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
