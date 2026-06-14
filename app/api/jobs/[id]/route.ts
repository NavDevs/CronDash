import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rescheduleJob, unscheduleJob } from "@/lib/scheduler"
import { requireUserId } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const resolvedParams = await params

    const job = await prisma.job.findFirst({
      where: { id: resolvedParams.id, userId },
      include: { runs: { orderBy: { executedAt: "desc" }, take: 10 } },
    })

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    return NextResponse.json(job)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const resolvedParams = await params
    const data = await request.json()

    const job = await prisma.job.updateMany({
      where: { id: resolvedParams.id, userId },
      data,
    })

    if (job.count > 0) {
      const updatedJob = await prisma.job.findUnique({ where: { id: resolvedParams.id } })
      if (updatedJob) {
        if (updatedJob.enabled) {
          rescheduleJob(updatedJob.id, updatedJob.schedule)
        } else {
          unscheduleJob(updatedJob.id)
        }
      }
    }

    return NextResponse.json({ updated: job.count })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const resolvedParams = await params

    unscheduleJob(resolvedParams.id)

    await prisma.job.deleteMany({
      where: { id: resolvedParams.id, userId },
    })

    return NextResponse.json({ message: "Job deleted" })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
