import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { requireUserId } from "@/lib/auth"

export async function POST() {
  try {
    const userId = await requireUserId()
    const newApiKey = randomBytes(16).toString("hex")

    await prisma.user.update({
      where: { id: userId },
      data: { apiKey: newApiKey },
    })

    return NextResponse.json({ apiKey: newApiKey })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
