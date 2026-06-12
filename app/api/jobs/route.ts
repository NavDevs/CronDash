import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { scheduleJob } from "@/lib/scheduler"

// GET all jobs for logged-in user
export async function GET() {
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

    const jobs = await prisma.job.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(jobs)
  } catch (error: any) {
    console.error("GET jobs error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new job
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
        userId: session.userId,
      },
    })

    scheduleJob(job.id, job.schedule)

    return NextResponse.json(job, { status: 201 })
  } catch (error: any) {
    console.error("POST jobs error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}