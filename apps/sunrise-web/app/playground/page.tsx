import type { Metadata } from "next"
import PlaygroundClient from "@/components/playground/playground-client"

export const metadata: Metadata = {
  title: "Playground · Sunrise / Sunset",
  description:
    "Explore Sunrise and Sunset builders, templates, contacts, and UI components in a safe demo. Nothing is sent or saved.",
}

export default function PlaygroundPage() {
  return <PlaygroundClient />
}
