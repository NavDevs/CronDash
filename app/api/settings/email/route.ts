import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const { alertEmail } = await req.json();

    await prisma.user.update({
      where: { id: session.userId },
      data: { alertEmail: alertEmail || null },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[SETTINGS] Email update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}