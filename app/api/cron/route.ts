import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeJob } from "@/lib/executor";

// External cron trigger endpoint
// Use this with cron-job.org or any external scheduler
// 
// Usage:
// GET /api/cron?apiKey=your-user-api-key
// 
// This endpoint:
// 1. Authenticates via user's API key
// 2. Finds all enabled jobs for that user
// 3. Executes each job
// 4. Returns execution results
//
// Recommended setup with cron-job.org:
// - URL: https://your-domain.com/api/cron?apiKey=YOUR_API_KEY
// - Schedule: */5 * * * * (every 5 minutes)
// - Request method: GET

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("apiKey");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required. Use ?apiKey=YOUR_API_KEY" },
        { status: 401 }
      );
    }

    // Find user by API key
    const user = await prisma.user.findUnique({
      where: { apiKey },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Get all enabled jobs for this user
    const jobs = await prisma.job.findMany({
      where: { userId: user.id, enabled: true },
    });

    // Filter jobs that are actually due
    // We add a 60-second buffer because external services like cron-job.org might ping slightly early
    const now = Date.now();
    const buffer = 60000; // 60 seconds
    const dueJobs = jobs.filter((job) => {
      return !job.nextRun || new Date(job.nextRun).getTime() <= now + buffer;
    });

    if (dueJobs.length === 0) {
      return NextResponse.json({
        message: "No jobs are due for execution at this time",
        executed: 0,
        results: [],
      });
    }

    // Execute due jobs in parallel
    const results = await Promise.allSettled(
      dueJobs.map(async (job) => {
        const startTime = Date.now();
        try {
          await executeJob(job.id);
          return {
            jobId: job.id,
            jobName: job.name,
            status: "success",
            duration: Date.now() - startTime,
          };
        } catch (error: any) {
          return {
            jobId: job.id,
            jobName: job.name,
            status: "failed",
            error: error.message,
            duration: Date.now() - startTime,
          };
        }
      })
    );

    // Summarize results
    const summary = results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        status: "error",
        error: result.reason?.message || "Unknown error",
      };
    });

    const successCount = summary.filter((r) => r.status === "success").length;
    const failedCount = summary.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      executed: jobs.length,
      success: successCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
      results: summary,
    });
  } catch (error: any) {
    console.error("[CRON] External trigger error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}