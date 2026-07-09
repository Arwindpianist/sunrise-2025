"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import EventDetailsStep from "./event-details-step"
import AudienceStep from "./audience-step"
import EmailTemplateStep from "./email-template-step"
import ReviewStep from "./review-step"
import type { ContactCategory, CreateEventForm } from "./types"
import { dispatchEventChannels } from "@/lib/event-dispatch"

const steps = ["Event details", "Audience", "Template & timing", "Review"]

const defaultForm: CreateEventForm = {
  title: "",
  description: "",
  eventDate: "",
  location: "",
  categoryId: "all",
  emailSubject: "",
  emailTemplate: "",
  sendOption: "now",
  scheduledSendTime: "",
}

type Contact = {
  id: string
  categories?: Array<{ id: string; name: string }>
}

export default function RedesignedCreateEventPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<ContactCategory[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [form, setForm] = useState<CreateEventForm>(defaultForm)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadData = async () => {
      try {
        const [categoriesResponse, contactsResponse] = await Promise.all([
          fetch("/api/contacts/categories", { cache: "no-store" }),
          fetch("/api/contacts", { cache: "no-store" }),
        ])

        const categoriesPayload = await categoriesResponse.json()
        const contactsPayload = await contactsResponse.json()

        if (categoriesResponse.ok) {
          setCategories(Array.isArray(categoriesPayload) ? categoriesPayload : [])
        }
        if (contactsResponse.ok) {
          setContacts(Array.isArray(contactsPayload) ? contactsPayload : [])
        }
      } catch (error) {
        console.error("Failed to load event form context:", error)
      }
    }

    loadData()
  }, [router, user])

  const estimatedRecipients = useMemo(() => {
    if (form.categoryId === "all") return contacts.length
    return contacts.filter((contact) =>
      (contact.categories || []).some((category) => category.id === form.categoryId),
    ).length
  }, [contacts, form.categoryId])

  const updateForm = <K extends keyof CreateEventForm>(field: K, nextValue: CreateEventForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: nextValue }))
  }

  const validateStep = () => {
    if (step === 0 && (!form.title || !form.eventDate)) {
      toast({
        title: "Missing details",
        description: "Please provide event title and date.",
        variant: "destructive",
      })
      return false
    }

    if (step === 2 && (!form.emailSubject || !form.emailTemplate)) {
      toast({
        title: "Email content is required",
        description: "Please fill email subject and template.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const createEvent = async () => {
    if (!validateStep()) return
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create event")
      }

      if (form.sendOption === "now") {
        await dispatchEventChannels(payload.event.id, { sendEmail: true })
      }

      toast({
        title: "Event created",
        description: form.sendOption === "now" ? "Event created and sending started." : "Event created successfully.",
      })
      router.push("/dashboard/events")
    } catch (error: any) {
      toast({
        title: "Could not create event",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length}: {steps[step]}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 ? <EventDetailsStep value={form} onChange={updateForm} /> : null}
          {step === 1 ? (
            <AudienceStep
              categories={categories}
              estimatedRecipients={estimatedRecipients}
              value={form}
              onChange={updateForm}
            />
          ) : null}
          {step === 2 ? <EmailTemplateStep value={form} onChange={updateForm} /> : null}
          {step === 3 ? <ReviewStep value={form} estimatedRecipients={estimatedRecipients} /> : null}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep((prev) => Math.max(0, prev - 1))} disabled={step === 0 || isSubmitting}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => validateStep() && setStep((prev) => prev + 1)} disabled={isSubmitting}>
                Next
              </Button>
            ) : (
              <Button onClick={createEvent} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Event"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

