import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// Sync endpoint for offline data
http.route({
  path: "/sync",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { entries } = body;

      if (!Array.isArray(entries)) {
        return new Response(JSON.stringify({ error: "Invalid entries format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const results = [];
      for (const entry of entries) {
        try {
          const result = await ctx.runMutation(api.attendance.logAttendance, {
            studentId: entry.studentId,
            fullName: entry.fullName,
            gradeLevel: entry.gradeLevel,
            strand: entry.strand,
            section: entry.section,
            lrnNumber: entry.lrnNumber,
          });
          results.push({ success: true, id: result });
        } catch (error: any) {
          results.push({ 
            success: false, 
            error: error.message,
            entry: entry.lrnNumber 
          });
        }
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
