import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    return user;
  },
});

export const create = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    role: v.string(),
    fullName: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newUserId = await ctx.db.insert("users", {
      username: args.username,
      password: args.password,
      role: args.role,
      fullName: args.fullName,
      email: args.email,
    });
    return newUserId;
  },
});
