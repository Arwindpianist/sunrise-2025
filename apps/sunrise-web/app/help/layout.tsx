import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Learn how to use Sunrise: accounts, contacts, events, messaging, templates, tokens, and troubleshooting. Mobile-friendly guides and shortcuts.",
  openGraph: {
    title: "Help Center | Sunrise",
    description:
      "Guides for getting started, managing contacts, creating events, and sending invitations with Sunrise.",
  },
}

export default function HelpLayout({ children }: { children: ReactNode }) {
  return children
}
