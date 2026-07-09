import { NextResponse } from "next/server"
import { issuePasswordResetToken } from "@/lib/password-reset"
import { sendEmail, DEFAULT_FROM_EMAIL } from "@/lib/zoho-email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const issued = await issuePasswordResetToken(email.trim())
    if (issued) {
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000"
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(issued.rawToken)}`

      await sendEmail({
        to: issued.email,
        from: DEFAULT_FROM_EMAIL,
        subject: "Reset your Sunrise password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>We received a request to reset your Sunrise account password.</p>
            <p>
              <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#f97316;color:#fff;text-decoration:none;border-radius:6px;">
                Reset Password
              </a>
            </p>
            <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({
      message: "If an account exists, a reset email has been sent.",
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
