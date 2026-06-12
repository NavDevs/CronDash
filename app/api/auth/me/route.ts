import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || ""

    const user = await prisma.user.upsert({
      where: { id: clerkUser.id },
      update: { email },
      create: { id: clerkUser.id, email },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("[ME] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
