import axios from "axios"
import { prisma } from "@/lib/prisma"
import { sendAlerts } from "./alerts"
import { getNextRunTime } from "./cron-utils"

export async function executeJob(jobId: string) {
  // fetch job from DB
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  })

  if (!job || !job.enabled) return

  const startTime = Date.now()
  const executedAt = new Date()

  // Calculate next run time
  const nextRun = getNextRunTime(job.schedule)

  // Prevent concurrent executions by atomically updating the nextRun time.
  // If another process (like the internal node-cron vs the external /api/cron) 
  // already updated it for this exact tick, this will return count: 0.
  const lock = await prisma.job.updateMany({
    where: { 
      id: jobId,
      nextRun: job.nextRun,
    },
    data: { nextRun },
  })

  if (lock.count === 0) {
    console.log(`[EXECUTOR] Skipping concurrent execution for job ${jobId}`)
    return
  }

  try {
    const response = await axios({
      method: job.method,
      url: job.url,
      headers: job.headers ? JSON.parse(job.headers) : {},
      data: job.body || undefined,
      timeout: 120000, // 120 second timeout to allow free-tier servers to wake up
    })

    const duration = Date.now() - startTime

    // save successful run
    await prisma.jobRun.create({
      data: {
        jobId: job.id,
        status: "success",
        statusCode: response.status,
        duration,
        response: JSON.stringify(response.data).slice(0, 500),
        executedAt,
      },
    })

    // update lastRun on job
    await prisma.job.update({
      where: { id: job.id },
      data: { lastRun: executedAt },
    })

  } catch (error: any) {
    const duration = Date.now() - startTime

    // save failed run
    await prisma.jobRun.create({
      data: {
        jobId: job.id,
        status: "failed",
        statusCode: error?.response?.status || null,
        duration,
        error: error?.message || "Unknown error",
        response: error?.response?.data
          ? JSON.stringify(error.response.data).slice(0, 500)
          : null,
        executedAt,
      },
    })

    // update lastRun on job
    await prisma.job.update({
      where: { id: job.id },
      data: { lastRun: executedAt },
    })

    // Send alerts on failure
    await sendAlerts(job.id, {
      jobId: job.id,
      jobName: job.name,
      status: "failed",
      statusCode: error?.response?.status,
      error: error?.message || "Unknown error",
      duration,
      executedAt,
    })
  }
}
