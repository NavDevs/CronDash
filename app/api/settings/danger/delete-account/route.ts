import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { unscheduleJob } from "@/lib/scheduler"

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

    const { action, confirmText } = await req.json()

    // Verify the confirmation text
    if (confirmText !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: "Please type 'DELETE MY ACCOUNT' to confirm" },
        { status: 400 }
      )
    }

    // Get all jobs for this user (to unschedule them)
    const jobs = await prisma.job.findMany({
      where: { userId: session.userId },
    })

    // Unschedule all jobs
    for (const job of jobs) {
      unscheduleJob(job.id)
    }

    // Delete user (cascade will delete jobs and runs due to onDelete: Cascade)
    await prisma.user.delete({
      where: { id: session.userId },
    })

    // Clear the session cookie
    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })

    response.cookies.delete("crondash-session")

    return response
  } catch (error: any) {
    console.error("[DANGER] Delete account error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}