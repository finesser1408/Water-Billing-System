import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all users
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get a user by username (used for login lookup)
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
  },
});

// Create a new user (admin only on the frontend)
export const create = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    role: v.string(),
    fullName: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (existing) throw new Error(`Username "${args.username}" already exists`);

    return await ctx.db.insert("users", {
      username: args.username,
      password: args.password,
      role: args.role,
      fullName: args.fullName,
      email: args.email,
      status: "Active",
    });
  },
});

// Deactivate a user account
export const deactivate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "Inactive" });
  },
});

// Reactivate a user account
export const reactivate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "Active" });
  },
});

// Reset a user's password
export const resetPassword = mutation({
  args: { id: v.id("users"), newPassword: v.string() },
  handler: async (ctx, { id, newPassword }) => {
    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error("Password must be at least 4 characters");
    }
    await ctx.db.patch(id, { password: newPassword.trim() });
  },
});

// Update last login timestamp
export const updateLastLogin = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const now = new Date()
      .toISOString()
      .replace("T", " ")
      .slice(0, 16);
    await ctx.db.patch(id, { lastLogin: now });
  },
});

// Seed the default System Administrator account — safe to call multiple times
export const seedAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "Ubetthina"))
      .first();
    if (!existing) {
      await ctx.db.insert("users", {
        username: "Ubetthina",
        password: "Ubetthina123",
        role: "System Administrator",
        fullName: "System Administrator",
        status: "Active",
      });
    }
  },
});
