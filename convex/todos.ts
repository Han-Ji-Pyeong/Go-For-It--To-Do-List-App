import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listByDueDate = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("todos")
      .withIndex("by_user_and_due_date", (q) => 
        q.eq("userId", userId)
         .gte("dueDate", args.startDate)
         .lte("dueDate", args.endDate)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    await ctx.db.insert("todos", {
      text: args.text,
      completed: false,
      userId,
      dueDate: args.dueDate,
      category: args.category,
      priority: args.priority,
      notes: args.notes
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("todos"),
    text: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== userId) throw new Error("Not found");
    
    const updates: any = {};
    if (args.text !== undefined) updates.text = args.text;
    if (args.completed !== undefined) updates.completed = args.completed;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.category !== undefined) updates.category = args.category;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.notes !== undefined) updates.notes = args.notes;
    
    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== userId) throw new Error("Not found");
    
    await ctx.db.delete(args.id);
  },
});
