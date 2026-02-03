import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  students: defineTable({
    fullName: v.string(),
    gradeLevel: v.string(),
    strand: v.string(),
    section: v.string(),
    lrnNumber: v.string(),
    createdBy: v.optional(v.id("users")),
    qrCodeData: v.optional(v.string()),
  })
    .index("by_lrn", ["lrnNumber"])
    .index("by_qr", ["qrCodeData"]),

  // NEW: Daily attendance pool system
  dailyAttendancePool: defineTable({
    studentId: v.id("students"),
    classId: v.string(),
    date: v.string(),
    firstScanTime: v.number(),
    status: v.literal("ACTIVE"),
    scannedBy: v.id("users"),
  })
    .index("by_class_date", ["classId", "date"])
    .index("by_student_date", ["studentId", "date"])
    .index("by_date", ["date"]),

  // Session-based attendance system (modified for masterkey)
  attendanceSessions: defineTable({
    classId: v.string(),
    subjectId: v.string(),
    date: v.string(),
    scheduleStartTime: v.string(),
    scheduleEndTime: v.string(),
    loginStartTime: v.optional(v.number()),
    loginEndTime: v.optional(v.number()),
    teacherVerifierId: v.optional(v.id("users")),
    status: v.union(v.literal("OPEN"), v.literal("CLOSED")),
    createdBy: v.id("users"),
  })
    .index("by_date", ["date"])
    .index("by_class_subject_date", ["classId", "subjectId", "date"])
    .index("by_status", ["status"]),

  attendanceLogs: defineTable({
    studentId: v.id("students"),
    sessionId: v.optional(v.id("attendanceSessions")),
    fullName: v.string(),
    gradeLevel: v.string(),
    strand: v.string(),
    section: v.string(),
    lrnNumber: v.string(),
    loginTimestamp: v.optional(v.number()),
    timestamp: v.optional(v.number()), // Legacy field for migration
    date: v.optional(v.string()), // Legacy field for migration
    logoutTimestamp: v.optional(v.number()),
    status: v.optional(v.union(v.literal("PENDING"), v.literal("VERIFIED"), v.literal("MODIFIED"))),
    arrivalCategory: v.optional(v.union(v.literal("EARLY"), v.literal("PRESENT"), v.literal("LATE"), v.literal("ABSENT"))),
    modificationReason: v.optional(v.string()),
    scannedBy: v.id("users"),
  })
    .index("by_session", ["sessionId"])
    .index("by_student", ["studentId"])
    .index("by_student_session", ["studentId", "sessionId"])
    .index("by_status", ["status"])
    .index("by_date", ["loginTimestamp"]),

  timetables: defineTable({
    classId: v.string(),
    subjectId: v.string(),
    subjectName: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    dayOfWeek: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_class", ["classId"])
    .index("by_class_day", ["classId", "dayOfWeek"])
    .index("by_subject", ["subjectId"]),

  // Legacy attendance table (keep for migration)
  attendance: defineTable({
    studentId: v.id("students"),
    fullName: v.string(),
    gradeLevel: v.string(),
    strand: v.string(),
    section: v.string(),
    lrnNumber: v.string(),
    date: v.string(),
    timestamp: v.number(),
    scannedBy: v.id("users"),
  })
    .index("by_date", ["date"])
    .index("by_student", ["studentId"])
    .index("by_student_date", ["studentId", "date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
