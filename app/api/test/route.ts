import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: Request) {
  try {
    const { url, method, headers, body } = await req.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const startTime = Date.now()
    const response = await axios({
      method: method || "GET",
      url,
      headers: headers || {},
      data: body || undefined,
      timeout: 15000,
      validateStatus: () => true,
    })
    const duration = Date.now() - startTime

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      duration,
      headers: response.headers,
      data: typeof response.data === "string" ? response.data.slice(0, 2000) : JSON.stringify(response.data).slice(0, 2000),
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "Request failed",
      duration: 0,
    }, { status: 200 })
  }
}
