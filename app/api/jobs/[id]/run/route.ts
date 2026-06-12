import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { executeJob } from "@/lib/executor"

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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const resolvedParams = await params
  
  const job = await prisma.job.findFirst({
    where: { id: resolvedParams.id, userId: session.userId },
  })

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  // run it now
  await executeJob(resolvedParams.id)

  return NextResponse.json({ message: "Job executed" })
}
