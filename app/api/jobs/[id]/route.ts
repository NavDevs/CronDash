import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { scheduleJob, unscheduleJob } from "@/lib/scheduler"

async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("crondash-session")
  
  if (!sessionCookie?.value) return null
  
  try {
    return JSON.parse(Buffer.from(sessionCookie.value, "base64").toString())
  } catch {
    return null
  }
}

// GET single job
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const job = await prisma.job.findFirst({
      where: { id: resolvedParams.id, userId: session.userId },
      include: { runs: { orderBy: { executedAt: 'desc' }, take: 10 } },
    })

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

    return NextResponse.json(job)
  } catch (error: any) {
    console.error("GET job error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update job (edit or enable/disable)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const data = await request.json()

    const job = await prisma.job.updateMany({
      where: { id: resolvedParams.id, userId: session.userId },
      data,
    })

    if (data.enabled === false) {
      unscheduleJob(resolvedParams.id)
    } else if (data.enabled === true) {
      const updatedJob = await prisma.job.findUnique({ where: { id: resolvedParams.id } })
      if (updatedJob) scheduleJob(updatedJob.id, updatedJob.schedule)
    }

    return NextResponse.json({ updated: job.count })
  } catch (error: any) {
    console.error("PUT job error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE a job
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params

    unscheduleJob(resolvedParams.id)

    await prisma.job.deleteMany({
      where: { id: resolvedParams.id, userId: session.userId },
    })

    return NextResponse.json({ message: "Job deleted" })
  } catch (error: any) {
    console.error("DELETE job error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}