"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FloatingSosButton() {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <Link href="/dashboard/sos">
        <Button
          size="lg"
          className={cn(
            "h-16 w-16 rounded-full shadow-lg border-4 transition-all duration-200 ease-out",
            "bg-red-500 border-red-600 hover:bg-red-600 hover:border-red-700",
            "focus:outline-none focus:ring-4 focus:ring-red-300",
            "animate-pulse",
            isPressed 
              ? "scale-95 shadow-xl" 
              : "hover:scale-105"
          )}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
        >
          <AlertTriangle className="h-8 w-8 text-white" />
        </Button>
      </Link>
      
      {/* Tooltip */}
      <div className="absolute bottom-20 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Emergency SOS
      </div>
      
      {/* Mobile-only label */}
      <div className="md:hidden absolute bottom-20 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
        SOS
      </div>
    </div>
  )
}
