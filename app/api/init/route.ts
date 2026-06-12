import { initScheduler } from "@/lib/scheduler"
import { NextResponse } from "next/server"

let initialized = false

export async function GET() {
  if (!initialized) {
    await initScheduler()
    initialized = true
  }
  return NextResponse.json({ status: "Scheduler running" })
}
