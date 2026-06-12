import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { scheduleJob, unscheduleJob } from "@/lib/scheduler"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("crondash-session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString())

    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params

    // Get current job state
    const job = await prisma.job.findFirst({
      where: { id: resolvedParams.id, userId: session.userId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Toggle enabled state
    const newEnabled = !job.enabled

    await prisma.job.update({
      where: { id: resolvedParams.id },
      data: { enabled: newEnabled },
    })

    // Update scheduler
    if (newEnabled) {
      scheduleJob(job.id, job.schedule)
    } else {
      unscheduleJob(job.id)
    }

    return NextResponse.json({
      enabled: newEnabled,
      message: newEnabled ? 'Job enabled' : 'Job disabled',
    })
  } catch (error: any) {
    console.error("[TOGGLE] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}