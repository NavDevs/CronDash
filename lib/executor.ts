import axios from "axios"
import { prisma } from "@/lib/prisma"

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

    // save successful run
    await prisma.jobRun.create({
      data: {
        jobId: job.id,
        status: "success",
        statusCode: response.status,
        duration,
        response: JSON.stringify(response.data).slice(0, 500),
      },
    })

    // update lastRun on job
    await prisma.job.update({
      where: { id: job.id },
      data: { lastRun: new Date() },
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
      },
    })

    // update lastRun on job
    await prisma.job.update({
      where: { id: job.id },
      data: { lastRun: new Date() },
    })
  }
}
