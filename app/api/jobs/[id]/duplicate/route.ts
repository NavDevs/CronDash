import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { scheduleJob } from "@/lib/scheduler"

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

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const original = await prisma.job.findFirst({
      where: { id: resolvedParams.id, userId: session.userId },
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
        userId: session.userId,
      },
    })

    if (duplicate.enabled) {
      scheduleJob(duplicate.id, duplicate.schedule)
    }

    return NextResponse.json(duplicate, { status: 201 })
  } catch (error: any) {
    console.error("Duplicate job error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
