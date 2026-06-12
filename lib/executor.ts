import axios from "axios"
import { prisma } from "@/lib/prisma"
import { sendAlerts } from "./alerts"

export async function executeJob(jobId: string) {
  // fetch job from DB
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  })

  if (!job || !job.enabled) return

  const startTime = Date.now()

  try {
    const response = await axios({
      method: job.method,
      url: job.url,
      headers: (job.headers as Record<string, string>) || {},
      data: job.body || undefined,
      timeout: 30000, // 30 second timeout
    })

    const duration = Date.now() - startTime
    const executedAt = new Date()

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
    const executedAt = new Date()

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
