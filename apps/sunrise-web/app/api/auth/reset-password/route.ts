import { NextResponse } from "next/server"
import { resetPasswordWithToken } from "@/lib/password-reset"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const result = await resetPasswordWithToken(token, password)
    if (!result.ok) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Password updated successfully." })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
