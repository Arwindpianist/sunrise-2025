"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import type { CreateEventForm } from "./types"

type Props = {
  value: CreateEventForm
  estimatedRecipients: number
}

export default function ReviewStep({ value, estimatedRecipients }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review before creating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="font-semibold">Title:</span> {value.title || "-"}</p>
        <p>
          <span className="font-semibold">Event date:</span>{" "}
          {value.eventDate ? format(new Date(value.eventDate), "PPpp") : "-"}
        </p>
        <p><span className="font-semibold">Location:</span> {value.location || "-"}</p>
        <p><span className="font-semibold">Recipients:</span> {estimatedRecipients}</p>
        <p><span className="font-semibold">Send mode:</span> {value.sendOption === "now" ? "Immediate" : "Scheduled"}</p>
        {value.sendOption === "schedule" && value.scheduledSendTime ? (
          <p>
            <span className="font-semibold">Scheduled time:</span>{" "}
            {format(new Date(value.scheduledSendTime), "PPpp")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

