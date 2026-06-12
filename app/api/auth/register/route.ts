import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email,
        password, // plain text for now
      },
    })

    // Create session cookie (auto-login after registration)
    const session = { userId: user.id, email: user.email }
    const sessionValue = Buffer.from(JSON.stringify(session)).toString("base64")
    
    const response = NextResponse.json(
      { message: "Account created", userId: user.id },
      { status: 201 }
    )
    
    response.cookies.set("crondash-session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}