import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"
import { checkRateLimit, recordFailedAttempt, recordSuccessfulLogin, getClientIP } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(req)
    const rateLimit = checkRateLimit(clientIP)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.waitSeconds / 60)} minutes.`,
          retryAfter: rateLimit.waitSeconds,
        },
        { status: 429 }
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      recordFailedAttempt(clientIP)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // OAuth-only users can't login with password
    if (!user.password) {
      return NextResponse.json(
        { error: "This account uses Google login. Please sign in with Google." },
        { status: 401 }
      )
    }

    // Compare hashed password
    const isValidPassword = await compare(password, user.password)

    if (!isValidPassword) {
      recordFailedAttempt(clientIP)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Clear rate limit on successful login
    recordSuccessfulLogin(clientIP)

    // Create session cookie
    const session = { userId: user.id, email: user.email }
    const sessionValue = Buffer.from(JSON.stringify(session)).toString("base64")
    
    const response = NextResponse.json(
      { message: "Logged in", userId: user.id },
      { status: 200 }
    )
    
    response.cookies.set("crondash-session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}