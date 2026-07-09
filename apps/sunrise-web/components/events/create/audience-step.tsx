"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ContactCategory, CreateEventForm } from "./types"

type Props = {
  categories: ContactCategory[]
  estimatedRecipients: number
  value: CreateEventForm
  onChange: <K extends keyof CreateEventForm>(field: K, nextValue: CreateEventForm[K]) => void
}

export default function AudienceStep({ categories, estimatedRecipients, value, onChange }: Props) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>Recipient group</Label>
        <Select
          value={value.categoryId}
          onValueChange={(nextValue) => onChange("categoryId", nextValue)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose who should receive this event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All contacts</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  {category.color ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                  ) : null}
                  {category.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        Estimated recipients: <span className="font-semibold">{estimatedRecipients}</span>
      </p>
    </div>
  )
}

