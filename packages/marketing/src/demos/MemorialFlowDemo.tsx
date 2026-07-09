"use client"

import { useMemo, useState } from "react"
import { Flower2 } from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  DateTimeLocalPicker,
  cn,
} from "@repo/ui"
import { useToast } from "@repo/ui/use-toast"
import { MEMORIAL_DEMO_CATEGORIES } from "../lib/memorial-demo-data"
import { countMemorialDemoRecipients } from "../lib/memorial-demo-data"
import { format } from "date-fns"

const steps = ["Occasion details", "Audience", "Message & timing", "Review"]

type MemorialDemoForm = {
  title: string
  description: string
  eventDate: string
  location: string
  categoryId: string
  emailSubject: string
  sendOption: "now" | "schedule"
}

function defaultDatetimeLocal() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  d.setHours(14, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function initialForm(): MemorialDemoForm {
  const eventDate = defaultDatetimeLocal()
  return {
    title: "Celebration of life - Eleanor Hart",
    description:
      "A quiet service followed by light refreshments. All who knew Eleanor are welcome. Photography only where posted.",
    eventDate,
    location: "St. Andrew's Chapel · reception hall",
    categoryId: "all",
    emailSubject: "Arrangements: Eleanor Hart",
    sendOption: "schedule",
  }
}

type Props = {
  compact?: boolean
  className?: string
}

export function MemorialFlowDemo({ compact, className }: Props) {
  const { toast: showToast } = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<MemorialDemoForm>(initialForm)

  const estimatedRecipients = useMemo(() => countMemorialDemoRecipients(form.categoryId), [form.categoryId])

  const updateForm = <K extends keyof MemorialDemoForm>(field: K, nextValue: MemorialDemoForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: nextValue }))
  }

  const progress = ((step + 1) / steps.length) * 100

  const validateStep = () => {
    if (step === 0 && (!form.title || !form.eventDate)) {
      showToast({
        title: "Missing details",
        description: "Add an occasion title and date; this mirrors the live memorial flow.",
        variant: "destructive",
      })
      return false
    }
    if (step === 2 && !form.emailSubject) {
      showToast({
        title: "Subject required",
        description: "Confirm how the message line should read before recipients open it.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const finishDemo = () => {
    showToast({
      title: "Demo complete",
      description: "Nothing was sent. Sign in with your Sunrise Sunset Services account to send real notices.",
    })
  }

  const eventDatePretty = useMemo(() => {
    try {
      return format(new Date(form.eventDate), "EEEE, MMMM do yyyy, h:mm a")
    } catch {
      return form.eventDate
    }
  }, [form.eventDate])

  return (
    <Card className={cn("border-border shadow-sm", className)}>
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">
              {compact ? "Walk through the memorial composer" : "Interactive memorial composer (preview)"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Step {step + 1} of {steps.length}: {steps[step]}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Flower2 className="h-4 w-4 shrink-0 text-primary" />
            <span>Demo: no messages sent</span>
          </div>
        </div>
        <Progress value={progress} className="h-2 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out" />
        <div className="flex flex-wrap gap-2">
          {steps.map((label, i) => (
            <button
              key={label}
              type="button"
              className={cn(
                "rounded-full px-3 py-1 text-xs motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
                i === step
                  ? "scale-[1.02] bg-primary/15 font-semibold text-primary shadow-sm ring-1 ring-primary/25"
                  : "bg-muted/60 text-muted-foreground hover:scale-[1.01] hover:bg-muted",
              )}
              onClick={() => setStep(i)}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-6", compact && "[&_textarea]:min-h-[140px] [&_textarea]:text-[11px]")}>
        <div
          key={step}
          className="space-y-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-2 motion-safe:duration-400 motion-safe:ease-out"
        >
          {step === 0 ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="mem-title">Occasion title</Label>
                <Input
                  id="mem-title"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="e.g. Celebration of life - full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mem-desc">Notes for guests</Label>
                <Textarea
                  id="mem-desc"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Tone, parking, donations in lieu of flowers, photography expectations…"
                  rows={compact ? 4 : 5}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="mem-when">Date & time</Label>
                  <DateTimeLocalPicker
                    id="mem-when"
                    value={form.eventDate}
                    onChange={(next) => updateForm("eventDate", next)}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    allowClear
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mem-where">Venue or link</Label>
                  <Input
                    id="mem-where"
                    value={form.location}
                    onChange={(e) => updateForm("location", e.target.value)}
                    placeholder="Chapel, hall, or streaming details"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3">
              <Label>Audience scope for this send</Label>
              <Select value={form.categoryId} onValueChange={(v) => updateForm("categoryId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Who should receive this notice?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All saved contacts ({countMemorialDemoRecipients("all")})</SelectItem>
                  {MEMORIAL_DEMO_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name} ({countMemorialDemoRecipients(cat.id)})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Categories help you separate immediate family, wider circles, and logistics contacts without mixing tone or
                timing.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mem-subject">Email subject line</Label>
                <Input
                  id="mem-subject"
                  value={form.emailSubject}
                  onChange={(e) => updateForm("emailSubject", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>When to deliver</Label>
                <Select value={form.sendOption} onValueChange={(v) => updateForm("sendOption", v as "now" | "schedule")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Schedule for review first (recommended)</SelectItem>
                    <SelectItem value="now">Send as soon as approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Template styling pulls from your Sunset presets so email, WhatsApp, and Telegram stay visually aligned and
                respectful of the moment.
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-3 text-sm">
              <p className="font-medium text-foreground">Review before sending</p>
              <ul className="space-y-2 rounded-xl border border-border bg-muted/30 p-4 text-muted-foreground">
                <li>
                  <span className="text-foreground">Occasion:</span> {form.title}
                </li>
                <li>
                  <span className="text-foreground">When:</span> {eventDatePretty}
                </li>
                <li>
                  <span className="text-foreground">Where:</span> {form.location}
                </li>
                <li>
                  <span className="text-foreground">Audience:</span>{" "}
                  {form.categoryId === "all"
                    ? "All contacts"
                    : MEMORIAL_DEMO_CATEGORIES.find((c) => c.id === form.categoryId)?.name ?? form.categoryId}
                  {" · "}
                  <span className="text-foreground">{estimatedRecipients}</span> recipients in preview data
                </li>
                <li>
                  <span className="text-foreground">Subject:</span> {form.emailSubject}
                </li>
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Back
          </Button>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  if (!validateStep()) return
                  setStep((s) => s + 1)
                }}
              >
                Continue
              </Button>
            ) : (
              <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={finishDemo}>
                Finish demo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
