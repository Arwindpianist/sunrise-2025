"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import EventDetailsStep from "@/components/events/create/event-details-step"
import AudienceStep from "@/components/events/create/audience-step"
import EmailTemplateStep from "@/components/events/create/email-template-step"
import ReviewStep from "@/components/events/create/review-step"
import type { CreateEventForm } from "@/components/events/create/types"
import { DEMO_CATEGORIES, countDemoRecipients } from "@/lib/sunrise-demo-data"
import { format } from "date-fns"
import { emailTemplates } from "@/components/email-templates"
import { wrapEmailHtmlForPreview } from "@/components/public/demo/sample-preview-html"

const steps = ["Event details", "Audience", "Template & timing", "Review"]

function defaultDatetimeLocal() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  d.setHours(17, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function initialDemoForm(): CreateEventForm {
  const eventDate = defaultDatetimeLocal()
  const generic = emailTemplates.find((t) => t.key === "generic")
  const eventDateFormatted = format(new Date(eventDate), "EEEE, MMMM do yyyy, h:mm a")
  const emailTemplate =
    generic?.template({
      eventTitle: "Summer Garden Party",
      eventDescription: "Bring a dish to share; casual attire, kids welcome.",
      eventDate: eventDateFormatted,
      eventLocation: "Community hall / map link in confirmation",
      hostName: "Sunrise Team",
      customMessage: "Bring a dish to share; casual attire, kids welcome.",
    }) ?? ""

  return {
    title: "Summer Garden Party",
    description: "Bring a dish to share; casual attire, kids welcome.",
    eventDate,
    location: "Community hall / map link in confirmation",
    categoryId: "all",
    emailSubject: "You're invited: Summer Garden Party",
    emailTemplate,
    sendOption: "now",
    scheduledSendTime: "",
  }
}

type Props = {
  compact?: boolean
  className?: string
}

export default function SunriseFlowDemo({ compact, className }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CreateEventForm>(initialDemoForm)

  const estimatedRecipients = useMemo(() => countDemoRecipients(form.categoryId), [form.categoryId])

  const updateForm = <K extends keyof CreateEventForm>(field: K, nextValue: CreateEventForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: nextValue }))
  }

  const progress = ((step + 1) / steps.length) * 100

  const validateStep = () => {
    if (step === 0 && (!form.title || !form.eventDate)) {
      toast({
        title: "Missing details",
        description: "Add an event title and date; same checks as the live builder.",
        variant: "destructive",
      })
      return false
    }
    if (step === 2 && (!form.emailSubject || !form.emailTemplate)) {
      toast({
        title: "Template required",
        description: "Choose a template preset and confirm subject line to mirror production.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const finishDemo = () => {
    toast({
      title: "Demo complete",
      description: "Nothing was sent. Create a free account to run this flow for real.",
    })
  }

  return (
    <Card className={cn("border-orange-100 shadow-sm", className)}>
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">
              {compact ? "Try the event builder" : "Interactive event builder (same steps as Sunrise)"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Step {step + 1} of {steps.length}: {steps[step]}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-orange-800">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Demo: no emails sent</span>
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
                  ? "scale-[1.02] bg-orange-100 font-semibold text-orange-900 shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:scale-[1.01] hover:bg-muted",
              )}
              onClick={() => setStep(i)}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-6",
          compact && "[&_textarea]:min-h-[160px] [&_textarea]:text-[11px]",
        )}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)]">
          <div
            key={step}
            className="space-y-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-2 motion-safe:duration-400 motion-safe:ease-out"
          >
            {step === 0 ? <EventDetailsStep value={form} onChange={updateForm} /> : null}
            {step === 1 ? (
              <AudienceStep
                categories={DEMO_CATEGORIES}
                estimatedRecipients={estimatedRecipients}
                value={form}
                onChange={updateForm}
              />
            ) : null}
            {step === 2 ? <EmailTemplateStep value={form} onChange={updateForm} /> : null}
            {step === 3 ? <ReviewStep value={form} estimatedRecipients={estimatedRecipients} /> : null}
          </div>

          {step === 2 && form.emailTemplate ? (
            <div className="space-y-2 lg:sticky lg:top-24 lg:self-start motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-400">
              <p className="text-sm font-medium text-foreground">Live HTML preview</p>
              <div className="relative mx-auto w-full max-w-[min(100%,420px)] overflow-hidden rounded-2xl border border-orange-100/90 bg-[#f6f8fc] shadow-inner motion-safe:transition-[box-shadow] motion-safe:duration-300">
                <iframe
                  title="Email preview"
                  className="block h-[clamp(220px,36svh,340px)] w-full max-h-[min(52svh,380px)] border-0 bg-transparent sm:h-[clamp(240px,34svh,360px)]"
                  srcDoc={wrapEmailHtmlForPreview(form.emailTemplate)}
                  sandbox="allow-same-origin"
                  scrolling="no"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Edit the HTML or pick another preset; preview updates from your template content.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          <div className="flex flex-wrap gap-2">
            {step < steps.length - 1 ? (
              <Button
                className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                onClick={() => validateStep() && setStep((s) => s + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                onClick={finishDemo}
              >
                Finish demo
              </Button>
            )}
            {!compact ? (
              <Button type="button" variant="ghost" asChild>
                <Link href="/register">Sign up to send for real</Link>
              </Button>
            ) : null}
          </div>
        </div>

        {compact ? (
          <p className="text-center text-sm text-muted-foreground">
            Want every control in one place?{" "}
            <Link href="/playground" className="font-semibold text-orange-700 underline underline-offset-2">
              Open the full playground
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
