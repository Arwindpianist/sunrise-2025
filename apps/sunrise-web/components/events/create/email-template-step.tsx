"use client"

import { format } from "date-fns"
import { DateTimeLocalPicker } from "@/components/ui/date-time-picker"
import { emailTemplates } from "@/components/email-templates"
import { SunsetProductHint } from "@/components/sunset-product-hint"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getTemplatesByChannel } from "@/lib/template-registry"
import { cn } from "@/lib/utils"
import type { CreateEventForm } from "./types"

type Props = {
  value: CreateEventForm
  onChange: <K extends keyof CreateEventForm>(field: K, nextValue: CreateEventForm[K]) => void
}

export default function EmailTemplateStep({ value, onChange }: Props) {
  const availableTemplates = getTemplatesByChannel("email")

  const applyTemplate = (templateKey: string) => {
    const template = emailTemplates.find((item) => item.key === templateKey)
    if (!template) return
    const html = template.template({
      eventTitle: value.title || "Your Event",
      eventDescription: value.description,
      eventDate: value.eventDate
        ? format(new Date(value.eventDate), "EEEE, MMMM do yyyy, h:mm a")
        : "TBA",
      eventLocation: value.location || "TBA",
      hostName: "Sunrise Team",
    })
    onChange("emailTemplate", html)
  }

  return (
    <div className="grid gap-4">
      <SunsetProductHint />
      <div className="grid gap-2">
        <Label>Email template preset</Label>
        <Select onValueChange={applyTemplate}>
          <SelectTrigger
            className={cn(
              "motion-safe:transition-all motion-safe:duration-200",
              "hover:border-orange-200 focus-visible:ring-orange-500/30",
            )}
          >
            <SelectValue placeholder="Choose a base template" />
          </SelectTrigger>
          <SelectContent>
            {availableTemplates.map((template) => (
              <SelectItem key={template.key} value={template.key}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email-subject">Email subject</Label>
        <Input
          id="email-subject"
          value={value.emailSubject}
          onChange={(event) => onChange("emailSubject", event.target.value)}
          placeholder="You're invited to..."
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email-template">Email HTML</Label>
        <Textarea
          id="email-template"
          value={value.emailTemplate}
          onChange={(event) => onChange("emailTemplate", event.target.value)}
          className="min-h-[260px] font-mono text-xs"
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Send mode</Label>
          <Select
            value={value.sendOption}
            onValueChange={(nextValue: "now" | "schedule") => onChange("sendOption", nextValue)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Send now</SelectItem>
              <SelectItem value="schedule">Schedule send</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {value.sendOption === "schedule" && (
          <div className="grid gap-2">
            <Label htmlFor="scheduled-send">Scheduled send time</Label>
            <DateTimeLocalPicker
              id="scheduled-send"
              value={value.scheduledSendTime}
              onChange={(next) => onChange("scheduledSendTime", next)}
              allowClear
            />
          </div>
        )}
      </div>
    </div>
  )
}

