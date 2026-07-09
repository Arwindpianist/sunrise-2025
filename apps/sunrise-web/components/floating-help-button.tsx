"use client"

import Link from "next/link"
import { LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FloatingHelpButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
      <Link href="/help">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:bg-primary/90 hover:shadow-xl"
          title="Get Help"
        >
          <LifeBuoy className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  )
} 