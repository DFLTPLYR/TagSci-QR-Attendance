import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Log attendance for a student
export const logAttendance = mutation({
  args: {
    studentId: v.id("students"),
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

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if attendance already exists for today
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) => 
        q.eq("studentId", args.studentId).eq("date", today)
      )
      .first();

    if (existingAttendance) {
      throw new Error("Attendance already recorded for this student today");
    }

    // Log the attendance
    const attendanceId = await ctx.db.insert("attendance", {
      studentId: args.studentId,
      fullName: args.fullName,
      gradeLevel: args.gradeLevel,
      strand: args.strand,
      section: args.section,
      lrnNumber: args.lrnNumber,
      date: today,
      timestamp: now.getTime(),
      scannedBy: userId,
    });

    return attendanceId;
  },
});

// Get student by QR code and log attendance
export const scanAndLogAttendance = mutation({
  args: { qrCodeData: v.string() },
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

    // Log attendance
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if attendance already exists for today
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) => 
        q.eq("studentId", student._id).eq("date", today)
      )
      .first();

    if (existingAttendance) {
      throw new Error("Attendance already recorded for this student today");
    }

    const attendanceId = await ctx.db.insert("attendance", {
      studentId: student._id,
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      strand: student.strand,
      section: student.section,
      lrnNumber: student.lrnNumber,
      date: today,
      timestamp: now.getTime(),
      scannedBy: userId,
    });

    return {
      attendanceId,
      student: {
        _id: student._id,
        fullName: student.fullName,
        gradeLevel: student.gradeLevel,
        strand: student.strand,
        section: student.section,
        lrnNumber: student.lrnNumber,
      }
    };
  },
});

// Get attendance logs by date
export const getAttendanceByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .order("desc")
      .collect();
  },
});

// Get today's attendance
export const getTodayAttendance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    return await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", today))
      .order("desc")
      .collect();
  },
});

// Get attendance logs by student
export const getAttendanceByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
  },
});
