import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Student login scan
export const studentLogin = mutation({
  args: { 
    qrCodeData: v.string(),
    sessionId: v.id("attendanceSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get session
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "OPEN") {
      throw new Error("Session is not open for attendance");
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

    // Check if student already logged in for this session
    const existingLog = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_student_session", (q) => 
        q.eq("studentId", student._id).eq("sessionId", args.sessionId)
      )
      .first();

    if (existingLog) {
      throw new Error("Student already logged in for this session");
    }

    const now = Date.now();
    const loginTime = new Date(now);
    const scheduleStart = new Date(`${session.date}T${session.scheduleStartTime}`);
    
    // Calculate arrival category
    let arrivalCategory: "EARLY" | "PRESENT" | "LATE" = "PRESENT";
    const timeDiff = loginTime.getTime() - scheduleStart.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < -5) {
      arrivalCategory = "EARLY";
    } else if (minutesDiff > 15) {
      arrivalCategory = "LATE";
    } else {
      arrivalCategory = "PRESENT";
    }

    // Create attendance log
    const logId = await ctx.db.insert("attendanceLogs", {
      studentId: student._id,
      sessionId: args.sessionId,
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      strand: student.strand,
      section: student.section,
      lrnNumber: student.lrnNumber,
      loginTimestamp: now,
      status: "PENDING",
      arrivalCategory,
      scannedBy: userId,
    });

    return {
      logId,
      student: {
        _id: student._id,
        fullName: student.fullName,
        gradeLevel: student.gradeLevel,
        strand: student.strand,
        section: student.section,
        lrnNumber: student.lrnNumber,
      },
      arrivalCategory,
    };
  },
});

// Get attendance logs by session
export const getLogsBySession = query({
  args: { sessionId: v.id("attendanceSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("attendanceLogs")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

// Get attendance logs with filters
export const getFilteredLogs = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    subjectId: v.optional(v.string()),
    classId: v.optional(v.string()),
    studentName: v.optional(v.string()),
    status: v.optional(v.string()),
    arrivalCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let logs = await ctx.db.query("attendanceLogs").order("desc").collect();

    // Apply filters
    if (args.dateFrom || args.dateTo) {
      const fromTime = args.dateFrom ? new Date(args.dateFrom).getTime() : 0;
      const toTime = args.dateTo ? new Date(args.dateTo).getTime() + 86400000 : Date.now();
      logs = logs.filter(log => {
        const timestamp = log.loginTimestamp || log.timestamp || 0;
        return timestamp >= fromTime && timestamp <= toTime;
      });
    }

    if (args.studentName) {
      logs = logs.filter(log => 
        log.fullName.toLowerCase().includes(args.studentName!.toLowerCase())
      );
    }

    if (args.status) {
      logs = logs.filter(log => log.status === args.status);
    }

    if (args.arrivalCategory) {
      logs = logs.filter(log => log.arrivalCategory === args.arrivalCategory);
    }

    // Get session details for each log
    const logsWithSessions = await Promise.all(
      logs.map(async (log) => {
        const session = log.sessionId ? await ctx.db.get(log.sessionId) : null;
        return {
          ...log,
          session,
        };
      })
    );

    // Apply session-based filters
    let filteredLogs = logsWithSessions;

    if (args.subjectId) {
      filteredLogs = filteredLogs.filter(log => log.session?.subjectId === args.subjectId);
    }

    if (args.classId) {
      filteredLogs = filteredLogs.filter(log => log.session?.classId === args.classId);
    }

    return filteredLogs;
  },
});

// Modify attendance status (teacher/admin only)
export const modifyAttendanceStatus = mutation({
  args: {
    logId: v.id("attendanceLogs"),
    newStatus: v.union(v.literal("VERIFIED"), v.literal("MODIFIED")),
    newArrivalCategory: v.optional(v.union(v.literal("EARLY"), v.literal("PRESENT"), v.literal("LATE"), v.literal("ABSENT"))),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const log = await ctx.db.get(args.logId);
    if (!log) {
      throw new Error("Attendance log not found");
    }

    await ctx.db.patch(args.logId, {
      status: "MODIFIED",
      arrivalCategory: args.newArrivalCategory || "PRESENT",
      modificationReason: args.reason,
    });

    return args.logId;
  },
});

// Get student's own attendance (for student self-view)
export const getMyAttendance = query({
  args: { studentId: v.optional(v.id("students")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    if (!args.studentId) {
      return [];
    }

    const logs = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId!))
      .order("desc")
      .collect();

    // Get session details for each log
    const logsWithSessions = await Promise.all(
      logs.map(async (log) => {
        const session = log.sessionId ? await ctx.db.get(log.sessionId) : null;
        return {
          ...log,
          session,
        };
      })
    );

    return logsWithSessions;
  },
});
