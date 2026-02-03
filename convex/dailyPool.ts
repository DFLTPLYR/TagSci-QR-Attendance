import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Student daily pool scan
export const addToPool = mutation({
  args: { 
    qrCodeData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find student by QR code
    let student = null;

    // First try to find by exact QR match
    student = await ctx.db
      .query("students")
      .withIndex("by_qr", (q) => q.eq("qrCodeData", args.qrCodeData))
      .first();

    // If not found, try to parse QR data and find by LRN
    if (!student) {
      try {
        const parsed = JSON.parse(args.qrCodeData);
        if (parsed.lrnNumber) {
          student = await ctx.db
            .query("students")
            .withIndex("by_lrn", (q) => q.eq("lrnNumber", parsed.lrnNumber))
            .first();
        }
      } catch (error) {
        // If parsing fails, treat as plain LRN
        student = await ctx.db
          .query("students")
          .withIndex("by_lrn", (q) => q.eq("lrnNumber", args.qrCodeData))
          .first();
      }
    }

    if (!student) {
      throw new Error("Student not found in the database");
    }

    const today = new Date().toISOString().split('T')[0];
    const classId = `${student.gradeLevel} ${student.strand} - ${student.section}`;

    // Check if student already in pool today
    const existingEntry = await ctx.db
      .query("dailyAttendancePool")
      .withIndex("by_student_date", (q) => 
        q.eq("studentId", student._id).eq("date", today)
      )
      .first();

    if (existingEntry) {
      throw new Error("Student already scanned today");
    }

    // Add to daily pool
    const poolId = await ctx.db.insert("dailyAttendancePool", {
      studentId: student._id,
      classId,
      date: today,
      firstScanTime: Date.now(),
      status: "ACTIVE",
      scannedBy: userId,
    });

    return {
      poolId,
      student: {
        _id: student._id,
        fullName: student.fullName,
        gradeLevel: student.gradeLevel,
        strand: student.strand,
        section: student.section,
        lrnNumber: student.lrnNumber,
      },
      scanTime: new Date().toLocaleTimeString(),
    };
  },
});

// Get daily pool for a class
export const getDailyPool = query({
  args: { 
    classId: v.string(),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const targetDate = args.date || new Date().toISOString().split('T')[0];

    const poolEntries = await ctx.db
      .query("dailyAttendancePool")
      .withIndex("by_class_date", (q) => 
        q.eq("classId", args.classId).eq("date", targetDate)
      )
      .order("desc")
      .collect();

    // Get student details for each entry
    const entriesWithStudents = await Promise.all(
      poolEntries.map(async (entry) => {
        const student = await ctx.db.get(entry.studentId);
        return {
          ...entry,
          student,
        };
      })
    );

    return entriesWithStudents;
  },
});

// Get today's pool count
export const getTodayPoolCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const poolEntries = await ctx.db
      .query("dailyAttendancePool")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    return poolEntries.length;
  },
});
