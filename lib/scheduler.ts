import cron, { ScheduledTask } from "node-cron"
import { prisma } from "@/lib/prisma"
import { executeJob } from "./executor"
import { getNextRunTime } from "./cron-utils"

// holds all active scheduled tasks in memory
const scheduledJobs = new Map<string, ScheduledTask>()
let initialized = false

// schedule a single job
export function scheduleJob(jobId: string, schedule: string) {
  // if already scheduled, stop it first
  if (scheduledJobs.has(jobId)) {
    scheduledJobs.get(jobId)?.stop()
    scheduledJobs.delete(jobId)
  }

  // validate cron expression before scheduling
  if (!cron.validate(schedule)) {
    console.error(`[SCHEDULER] Invalid cron expression for job ${jobId}: ${schedule}`)
    return
  }

  const task = cron.schedule(schedule, async () => {
    console.log(`[SCHEDULER] Running job ${jobId} at ${new Date().toISOString()}`)
    await executeJob(jobId)
  })

  scheduledJobs.set(jobId, task)
  console.log(`[SCHEDULER] Scheduled job ${jobId} with schedule: ${schedule}`)
}

// remove a job from scheduler
export function unscheduleJob(jobId: string) {
  if (scheduledJobs.has(jobId)) {
    scheduledJobs.get(jobId)?.stop()
    scheduledJobs.delete(jobId)
    console.log(`[SCHEDULER] Unscheduled job ${jobId}`)
  }
}

// reschedule a job after editing (schedule may have changed)
export function rescheduleJob(jobId: string, schedule: string) {
  unscheduleJob(jobId)
  scheduleJob(jobId, schedule)
}

// load ALL active jobs from DB and schedule them
export async function initScheduler() {
  if (initialized) return
  initialized = true

  console.log("[SCHEDULER] Initializing...")

  const jobs = await prisma.job.findMany({
    where: { enabled: true },
  })

  for (const job of jobs) {
    scheduleJob(job.id, job.schedule)
    const nextRun = getNextRunTime(job.schedule)
    if (nextRun) {
      await prisma.job.update({
        where: { id: job.id },
        data: { nextRun },
      }).catch(() => {})
    }
  }

  console.log(`[SCHEDULER] Loaded ${jobs.length} jobs`)
}

// Auto-initialize on module load (fires when server starts)
initScheduler()
