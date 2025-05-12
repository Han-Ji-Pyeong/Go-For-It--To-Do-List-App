import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string())
  })
    .index("by_user", ["userId"])
    .index("by_user_and_completed", ["userId", "completed"])
    .index("by_user_and_due_date", ["userId", "dueDate"]),

  categories: defineTable({
    name: v.string(),
    color: v.string(),
    userId: v.id("users")
  }).index("by_user", ["userId"])
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});