import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({ message: "Prisma is working", userCount })
  } catch (error: any) {
    console.error("Prisma error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}