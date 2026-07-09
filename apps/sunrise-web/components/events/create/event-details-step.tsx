"use client"

import { DateTimeLocalPicker } from "@/components/ui/date-time-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CreateEventForm } from "./types"

type Props = {
  value: CreateEventForm
  onChange: <K extends keyof CreateEventForm>(field: K, nextValue: CreateEventForm[K]) => void
}

export default function EventDetailsStep({ value, onChange }: Props) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Event title</Label>
        <Input
          id="title"
          value={value.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Birthday dinner, team gathering, launch party..."
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={value.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Add a short message recipients should know."
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="event-date">Event date & time</Label>
          <DateTimeLocalPicker
            id="event-date"
            value={value.eventDate}
            onChange={(next) => onChange("eventDate", next)}
            allowClear
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={value.location}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="Venue or virtual meeting link"
          />
        </div>
      </div>
    </div>
  )
}
