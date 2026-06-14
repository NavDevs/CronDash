import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { executeJob } from "@/lib/executor"
import { requireUserId } from "@/lib/auth"

export async function POST(
  req: Request,
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

    await executeJob(resolvedParams.id)

    return NextResponse.json({ message: "Job executed" })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
