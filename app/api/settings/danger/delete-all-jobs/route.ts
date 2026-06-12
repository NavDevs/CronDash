import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { unscheduleJob } from "@/lib/scheduler"

export async function POST(req: Request) {
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

    const { action, confirmText } = await req.json()

    // Verify the confirmation text
    if (confirmText !== 'DELETE ALL JOBS') {
      return NextResponse.json(
        { error: "Please type 'DELETE ALL JOBS' to confirm" },
        { status: 400 }
      )
    }

    // Get all jobs for this user
    const jobs = await prisma.job.findMany({
      where: { userId: session.userId },
    })

    // Unschedule all jobs from the scheduler
    for (const job of jobs) {
      unscheduleJob(job.id)
    }

    // Delete all job runs first (due to foreign key)
    await prisma.jobRun.deleteMany({
      where: {
        job: {
          userId: session.userId,
        },
      },
    })

    // Delete all jobs
    const deleted = await prisma.job.deleteMany({
      where: { userId: session.userId },
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} jobs`,
    })
  } catch (error: any) {
    console.error("[DANGER] Delete all jobs error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}