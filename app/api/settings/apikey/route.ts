import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("crondash-session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());

    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate new API key
    const newApiKey = randomBytes(16).toString("hex");

    await prisma.user.update({
      where: { id: session.userId },
      data: { apiKey: newApiKey },
    });

    return NextResponse.json({ apiKey: newApiKey });
  } catch (error: any) {
    console.error("[SETTINGS] API key regeneration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}