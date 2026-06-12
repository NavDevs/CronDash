import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/clerk-auth"

export async function GET(
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

    const runs = await prisma.jobRun.findMany({
      where: { jobId: resolvedParams.id },
      orderBy: { executedAt: "desc" },
      take: 50,
    })

    return NextResponse.json(runs)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
