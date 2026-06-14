import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUserId } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const userId = await requireUserId()
    const { alertEmail } = await req.json()

    await prisma.user.update({
      where: { id: userId },
      data: { alertEmail: alertEmail || null },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
