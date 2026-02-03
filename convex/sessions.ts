import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create attendance session
export const createSession = mutation({
  args: {
    classId: v.string(),
    subjectId: v.string(),
    scheduleStartTime: v.string(),
    scheduleEndTime: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if session already exists for this class/subject/date
    const existingSession = await ctx.db
      .query("attendanceSessions")
      .withIndex("by_class_subject_date", (q) => 
        q.eq("classId", args.classId)
         .eq("subjectId", args.subjectId)
         .eq("date", today)
      )
      .first();

    if (existingSession) {
      throw new Error("Session already exists for this class and subject today");
    }

    const sessionId = await ctx.db.insert("attendanceSessions", {
      classId: args.classId,
      subjectId: args.subjectId,
      date: today,
      scheduleStartTime: args.scheduleStartTime,
      scheduleEndTime: args.scheduleEndTime,
      loginStartTime: Date.now(),
      status: "OPEN",
      createdBy: userId,
    });

    return sessionId;
  },
});

// Generate teacher masterkey QR for session verification
export const generateTeacherQR = mutation({
  args: { sessionId: v.id("attendanceSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "OPEN") {
      throw new Error("Session is not open");
    }

    // Generate masterkey QR data
    const masterkeyData = {
      type: "MASTERKEY",
      sessionId: args.sessionId,
      classId: session.classId,
      subjectId: session.subjectId,
      date: session.date,
      timestamp: Date.now(),
    };

    return JSON.stringify(masterkeyData);
  },
});

// Process masterkey scan - verify entire daily pool for the session
export const processMasterkeyVerification = mutation({
  args: { 
    qrCodeData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let masterkeyData;
    try {
      masterkeyData = JSON.parse(args.qrCodeData);
    } catch (error) {
      throw new Error("Invalid masterkey QR code");
    }

    if (masterkeyData.type !== "MASTERKEY") {
      throw new Error("Not a masterkey QR code");
    }

    const session = await ctx.db.get(masterkeyData.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Type guard to ensure we have an attendance session
    if (!('status' in session) || !('classId' in session)) {
      throw new Error("Invalid session type");
    }

    const attendanceSession = session as any; // Cast to attendance session type

    if (attendanceSession.status !== "OPEN") {
      throw new Error("Session is already closed");
    }

    // Get all students in daily pool for this class/date
    const poolEntries = await ctx.db
      .query("dailyAttendancePool")
      .withIndex("by_class_date", (q) => 
        q.eq("classId", attendanceSession.classId).eq("date", attendanceSession.date)
      )
      .collect();

    // Get timetable entry for arrival category calculation
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    const timetableEntry = await ctx.db
      .query("timetables")
      .withIndex("by_class_day", (q) => 
        q.eq("classId", attendanceSession.classId).eq("dayOfWeek", dayOfWeek)
      )
      .filter((q) => q.eq(q.field("subjectId"), attendanceSession.subjectId))
      .first();

    const verifiedCount = poolEntries.length;
    const logIds = [];

    // Create verified attendance logs for all pool students
    for (const poolEntry of poolEntries) {
      const student = await ctx.db.get(poolEntry.studentId);
      if (!student) continue;

      // Calculate arrival category based on first scan time vs schedule
      let arrivalCategory: "EARLY" | "PRESENT" | "LATE" = "PRESENT";
      
      if (timetableEntry) {
        const scheduleStart = new Date(`${attendanceSession.date}T${timetableEntry.startTime}`);
        const scanTime = new Date(poolEntry.firstScanTime);
        const timeDiff = scanTime.getTime() - scheduleStart.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        if (minutesDiff < -5) {
          arrivalCategory = "EARLY";
        } else if (minutesDiff > 15) {
          arrivalCategory = "LATE";
        } else {
          arrivalCategory = "PRESENT";
        }
      }

      // Check if log already exists for this student/session
      const existingLog = await ctx.db
        .query("attendanceLogs")
        .withIndex("by_student_session", (q) => 
          q.eq("studentId", student._id).eq("sessionId", attendanceSession._id)
        )
        .first();

      if (!existingLog) {
        const logId = await ctx.db.insert("attendanceLogs", {
          studentId: student._id,
          sessionId: attendanceSession._id,
          fullName: student.fullName,
          gradeLevel: student.gradeLevel,
          strand: student.strand,
          section: student.section,
          lrnNumber: student.lrnNumber,
          loginTimestamp: poolEntry.firstScanTime,
          status: "VERIFIED",
          arrivalCategory,
          scannedBy: poolEntry.scannedBy,
        });
        logIds.push(logId);
      }
    }

    // Close the session
    await ctx.db.patch(attendanceSession._id, {
      status: "CLOSED",
      loginEndTime: Date.now(),
      teacherVerifierId: userId,
    });

    return {
      sessionId: attendanceSession._id,
      verifiedCount,
      logIds,
      classId: attendanceSession.classId,
      subjectId: attendanceSession.subjectId,
    };
  },
});

// Get open sessions
export const getOpenSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("attendanceSessions")
      .withIndex("by_status", (q) => q.eq("status", "OPEN"))
      .order("desc")
      .collect();
  },
});

// Get sessions by class
export const getSessionsByClass = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const today = new Date().toISOString().split('T')[0];
    
    return await ctx.db
      .query("attendanceSessions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .filter((q) => q.eq(q.field("classId"), args.classId))
      .order("desc")
      .collect();
  },
});

// Close session manually (without masterkey)
export const closeSession = mutation({
  args: { sessionId: v.id("attendanceSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "OPEN") {
      throw new Error("Session is already closed");
    }

    await ctx.db.patch(args.sessionId, {
      status: "CLOSED",
      loginEndTime: Date.now(),
      teacherVerifierId: userId,
    });

    return args.sessionId;
  },
});
