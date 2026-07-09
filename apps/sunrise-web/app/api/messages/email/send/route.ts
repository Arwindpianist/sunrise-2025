import { NextResponse } from "next/server"

/**
 * Legacy endpoint retained for compatibility. The canonical event-email pipeline
 * now lives in /api/email/send.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint. Use /api/email/send for email delivery.",
    },
    { status: 410 },
  )
}