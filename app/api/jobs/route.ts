import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { scheduleJob } from "@/lib/scheduler"
import { requireUserId } from "@/lib/clerk-auth"

export async function GET() {
  try {
    const userId = await requireUserId()

    const jobs = await prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { runs: { orderBy: { executedAt: "desc" }, take: 1 } },
    })

    return NextResponse.json(jobs)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId()
    const body = await req.json()
    const { name, url, method, headers, body: requestBody, schedule } = body

    if (!name || !url || !schedule) {
      return NextResponse.json(
        { error: "Name, URL and schedule are required" },
        { status: 400 }
      )
    }

    const job = await prisma.job.create({
      data: {
        name,
        url,
        method: method || "GET",
        headers: headers ? JSON.stringify(headers) : null,
        body: requestBody ? JSON.stringify(requestBody) : null,
        schedule,
        userId,
      },
    })

    scheduleJob(job.id, job.schedule)

    return NextResponse.json(job, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
