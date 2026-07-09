import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the Sunrise team by email, find support and business details, and get quick links to help and pricing.",
  openGraph: {
    title: "Contact | Sunrise",
    description: "Email Sunrise for support, billing, and product questions.",
  },
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
