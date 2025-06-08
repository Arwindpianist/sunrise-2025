"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  date: Date
  onSelect: (date: Date) => void
  className?: string
}

export function DateTimePicker({ date, onSelect, className }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date(date))
  const [selectedTime, setSelectedTime] = React.useState<string>(() => format(date, "HH:mm"))

  // Generate time options in 30-minute intervals
  const timeOptions = React.useMemo(() => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`
        options.push(timeString)
      }
    }
    return options
  }, [])

  React.useEffect(() => {
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes)
      onSelect(newDate)
    } catch (error) {
      console.error("Error updating date:", error)
    }
  }, [selectedDate, selectedTime, onSelect])

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-col space-y-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="rounded-md border shadow-md"
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center space-x-2 bg-white rounded-md border p-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedTime}
            onValueChange={setSelectedTime}
          >
            <SelectTrigger className="w-[120px] border-0 focus:ring-0">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {timeOptions.map((time) => (
                <SelectItem 
                  key={time} 
                  value={time}
                  className="cursor-pointer hover:bg-accent"
                >
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 