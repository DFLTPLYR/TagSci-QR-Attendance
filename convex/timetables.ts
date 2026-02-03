import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create timetable entry
export const createTimetableEntry = mutation({
  args: {
    classId: v.string(),
    subjectId: v.string(),
    subjectName: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    dayOfWeek: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if entry already exists
    const existing = await ctx.db
      .query("timetables")
      .withIndex("by_class_day", (q) => 
        q.eq("classId", args.classId).eq("dayOfWeek", args.dayOfWeek)
      )
      .filter((q) => q.eq(q.field("subjectId"), args.subjectId))
      .first();

    if (existing) {
      throw new Error("Timetable entry already exists for this class, subject, and day");
    }

    return await ctx.db.insert("timetables", {
      ...args,
      createdBy: userId,
    });
  },
});

// Get timetable by class
export const getTimetableByClass = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("timetables")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();
  },
});

// Get all timetables
export const getAllTimetables = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db.query("timetables").collect();
  },
});

// Update timetable entry
export const updateTimetableEntry = mutation({
  args: {
    entryId: v.id("timetables"),
    subjectName: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { entryId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(entryId, filteredUpdates);
    return entryId;
  },
});

// Delete timetable entry
export const deleteTimetableEntry = mutation({
  args: { entryId: v.id("timetables") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.entryId);
    return args.entryId;
  },
});

// Get subjects list
export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const timetables = await ctx.db.query("timetables").collect();
    const subjects = Array.from(
      new Set(timetables.map(t => JSON.stringify({ id: t.subjectId, name: t.subjectName })))
    ).map(s => JSON.parse(s));

    return subjects;
  },
});

// Get classes list
export const getClasses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const timetables = await ctx.db.query("timetables").collect();
    const classes = Array.from(new Set(timetables.map(t => t.classId)));

    return classes;
  },
});
