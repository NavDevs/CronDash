import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("crondash-session")
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString())
    
    if (!session.userId) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, slackWebhook: true, alertEmail: true, apiKey: true },
    })

    return NextResponse.json({ user }, { status: 200 })
  } catch (error: any) {
    console.error("Get user error:", error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}