import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { scheduleJob, unscheduleJob } from "@/lib/scheduler"
import { requireUserId } from "@/lib/clerk-auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const resolvedParams = await params

    const job = await prisma.job.findFirst({
      where: { id: resolvedParams.id, userId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const newEnabled = !job.enabled

    await prisma.job.update({
      where: { id: resolvedParams.id },
      data: { enabled: newEnabled },
    })

    if (newEnabled) {
      scheduleJob(job.id, job.schedule)
    } else {
      unscheduleJob(job.id)
    }

    return NextResponse.json({
      enabled: newEnabled,
      message: newEnabled ? "Job enabled" : "Job disabled",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
