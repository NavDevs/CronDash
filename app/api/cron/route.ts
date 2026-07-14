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

    // Execute due jobs in the background (asynchronously)
    // We do NOT await this because if jobs take too long, the external
    // cron service (like cron-job.org) will timeout and report an error.
    Promise.allSettled(
      dueJobs.map((job) => executeJob(job.id))
    ).catch(console.error);

    return NextResponse.json({
      message: "Jobs triggered successfully in the background",
      executed: dueJobs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON] External trigger error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}