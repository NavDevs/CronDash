import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { unscheduleJob } from "@/lib/scheduler"
import { requireUserId } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const userId = await requireUserId()
    const { confirmText } = await req.json()

    if (confirmText !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { error: "Please type 'DELETE MY ACCOUNT' to confirm" },
        { status: 400 }
      )
    }

    const jobs = await prisma.job.findMany({ where: { userId } })

    for (const job of jobs) {
      unscheduleJob(job.id)
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
