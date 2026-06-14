import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { scheduleJob } from "@/lib/scheduler"
import { requireUserId } from "@/lib/auth"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const resolvedParams = await params

    const original = await prisma.job.findFirst({
      where: { id: resolvedParams.id, userId },
    })

    if (!original) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const duplicate = await prisma.job.create({
      data: {
        name: `${original.name} (copy)`,
        url: original.url,
        method: original.method,
        headers: original.headers,
        body: original.body,
        schedule: original.schedule,
        enabled: false,
        userId,
      },
    })

    if (duplicate.enabled) {
      scheduleJob(duplicate.id, duplicate.schedule)
    }

    return NextResponse.json(duplicate, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
