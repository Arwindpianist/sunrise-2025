"use client"

import * as React from "react"
import { format, addMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  date: Date
  onSelect: (date: Date) => void
  className?: string
}

export function DateTimePicker({ date, onSelect, className }: DateTimePickerProps) {
  const [mounted, setMounted] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const now = new Date()
    const defaultDate = addMinutes(now, 10)
    return format(defaultDate, "yyyy-MM-dd")
  })
  const [selectedTime, setSelectedTime] = React.useState<string>(() => {
    const now = new Date()
    const defaultDate = addMinutes(now, 10)
    return format(defaultDate, "HH:mm")
  })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    try {
      const [year, month, day] = selectedDate.split("-").map(Number)
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const newDate = new Date(year, month - 1, day, hours, minutes)
      onSelect(newDate)
    } catch (error) {
      console.error("Error updating date:", error)
    }
  }, [selectedDate, selectedTime, onSelect, mounted])

  if (!mounted) {
    return (
      <div className={cn("grid gap-2", className)}>
        <div className="flex flex-col space-y-2">
          <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md" />
          <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-col space-y-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            min={format(new Date(), "yyyy-MM-dd")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <input
            id="time"
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
          />
        </div>
      </div>
    </div>
  )
} 