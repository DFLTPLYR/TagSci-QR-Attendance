import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createStudent = mutation({
  args: {
    fullName: v.string(),
    gradeLevel: v.string(),
    strand: v.string(),
    section: v.string(),
    lrnNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if student with this LRN already exists
    const existing = await ctx.db
      .query("students")
      .withIndex("by_lrn", (q) => q.eq("lrnNumber", args.lrnNumber))
      .first();

    // Create QR code data
    const qrCodeData = JSON.stringify({
      fullName: args.fullName,
      gradeLevel: args.gradeLevel,
      strand: args.strand,
      section: args.section,
      lrnNumber: args.lrnNumber,
    });

    if (existing) {
      // Update existing student with new QR data
      await ctx.db.patch(existing._id, {
        fullName: args.fullName,
        gradeLevel: args.gradeLevel,
        strand: args.strand,
        section: args.section,
        qrCodeData: qrCodeData,
      });
      return existing._id;
    }

    // Create new student with QR data
    return await ctx.db.insert("students", {
      ...args,
      createdBy: userId,
      qrCodeData: qrCodeData,
    });
  },
});

export const getStudentByLrn = query({
  args: { lrnNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_lrn", (q) => q.eq("lrnNumber", args.lrnNumber))
      .first();
  },
});

export const getStudentByQR = query({
  args: { qrCodeData: v.string() },
  handler: async (ctx, args) => {
    // First try to find by exact QR match
    const studentByQR = await ctx.db
      .query("students")
      .withIndex("by_qr", (q) => q.eq("qrCodeData", args.qrCodeData))
      .first();

    if (studentByQR) {
      return studentByQR;
    }

    // If not found, try to parse QR data and find by LRN
    try {
      const parsed = JSON.parse(args.qrCodeData);
      if (parsed.lrnNumber) {
        const studentByLRN = await ctx.db
          .query("students")
          .withIndex("by_lrn", (q) => q.eq("lrnNumber", parsed.lrnNumber))
          .first();
        
        if (studentByLRN) {
          return studentByLRN;
        }
      }
    } catch (error) {
      // If parsing fails, treat as plain LRN
      const studentByLRN = await ctx.db
        .query("students")
        .withIndex("by_lrn", (q) => q.eq("lrnNumber", args.qrCodeData))
        .first();
      
      if (studentByLRN) {
        return studentByLRN;
      }
    }

    return null;
  },
});

export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db.query("students").collect();
  },
});
