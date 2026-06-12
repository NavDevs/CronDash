import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_auth_failed`)
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_token_failed`)
    }

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    )

    const googleUser = await userRes.json()

    if (!googleUser.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_user_failed`)
    }

    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          password: null,
        },
      })
    }

    const session = { userId: user.id, email: user.email }
    const sessionValue = Buffer.from(JSON.stringify(session)).toString("base64")

    const response = NextResponse.redirect(`${baseUrl}/dashboard`)

    response.cookies.set("crondash-session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (err) {
    console.error("Google callback error:", err)
    return NextResponse.redirect(`${baseUrl}/login?error=google_auth_failed`)
  }
}
