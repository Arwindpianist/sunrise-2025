"use client"

import Link from "next/link"
import { AlertTriangle, Puzzle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import MessageChannelPreviewSection from "@/components/public/demo/message-channel-preview"
import SunriseFlowDemo from "@/components/public/demo/sunrise-flow-demo"
import ContactBoardDemo from "@/components/public/demo/contact-board-demo"
import ContactLinkFormDemo from "@/components/public/demo/contact-link-form-demo"
import PlaygroundAccountTools from "@/components/playground/playground-account-tools"
import PlaygroundSosPwaSection from "@/components/playground/playground-sos-pwa-section"
import { useBrand } from "@repo/ui/brand-provider"
import {
  MemorialFlowDemo,
  MemorialMessageChannelPreview,
  MemorialContactBoardDemo,
  MemorialContactLinkFormDemo,
} from "@repo/marketing"

export default function PlaygroundClient() {
  const brand = useBrand()
  const isSunset = brand === "sunset"

  return (
    <div className={isSunset ? "sunset-marketing min-h-screen bg-background" : "min-h-screen bg-gradient-to-b from-orange-50/80 via-white to-rose-50/60"}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className={isSunset ? "mb-2 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary" : "mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-800"}>
              <Puzzle className="h-3.5 w-3.5" />
              {isSunset ? "Sunset playground" : "Sunrise playground"}
            </div>
            <h1 className={isSunset ? "text-3xl font-black tracking-tight text-foreground sm:text-4xl" : "text-3xl font-black tracking-tight text-gray-900 sm:text-4xl"}>
              {isSunset ? "Explore memorial workflows; nothing leaves your browser" : "Touch the whole workflow; nothing leaves your browser"}
            </h1>
            <p className={isSunset ? "mt-3 max-w-2xl text-muted-foreground" : "mt-3 max-w-2xl text-gray-600"}>
              {isSunset
                ? "Explore memorial composition, contacts, tokens, integrations, SOS, and install flows using Sunset surfaces. Sends and purchases remain simulated here."
                : "Explore event creation, contacts, tokens, integrations, SOS, and install flows using the same surfaces as your workspace. Sends and purchases stay simulated here; sign in for live data."}
            </p>
          </div>
          <Button asChild variant="outline" className={isSunset ? "shrink-0 border-primary/35 text-primary hover:bg-primary/10" : "shrink-0 border-orange-200"}>
            <Link href="/">Back to home</Link>
          </Button>
        </div>

        <Alert className={isSunset ? "mb-10 border-primary/35 bg-primary/12 text-foreground" : "mb-10 border-amber-300 bg-amber-50 text-amber-950"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No live sends from this page</AlertTitle>
          <AlertDescription>
            {isSunset
              ? "Messages, memorial alerts, and billing actions are not executed here. Create an account to run real Sunset workflows."
              : "Messages, SOS alerts, and billing actions are not executed here. Create an account to connect contacts and run real workflows."}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-14">
          <section className="space-y-4" id="builder">
            <h2 className={isSunset ? "text-2xl font-semibold text-foreground" : "text-2xl font-semibold text-gray-900"}>{isSunset ? "Memorial builder" : "Event builder"}</h2>
            <p className={isSunset ? "max-w-3xl text-sm text-muted-foreground" : "max-w-3xl text-sm text-gray-600"}>
              Same four steps as the dashboard: details → audience → template & timing → review. Pick a template preset, tweak
              HTML, and preview rendered email beside the form.
            </p>
            {isSunset ? <MemorialFlowDemo /> : <SunriseFlowDemo />}
          </section>

          <section className="space-y-4" id="channels">
            <h2 className={isSunset ? "text-2xl font-semibold text-foreground" : "text-2xl font-semibold text-gray-900"}>Channel previews</h2>
            {isSunset ? (
              <MemorialMessageChannelPreview className="sunset-panel rounded-3xl border border-border bg-card/85 p-6 shadow-sm" />
            ) : (
              <MessageChannelPreviewSection
                className="rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-sm"
                heading="How the copy lands per channel"
                subheading="Tone and layout shift per channel while your event story stays consistent."
              />
            )}
          </section>

          <section className="space-y-4" id="contacts">
            <h2 className={isSunset ? "text-2xl font-semibold text-foreground" : "text-2xl font-semibold text-gray-900"}>Contacts & categories</h2>
            {isSunset ? <MemorialContactBoardDemo /> : <ContactBoardDemo />}
          </section>

          <section className="space-y-4" id="collect">
            <h2 className={isSunset ? "text-2xl font-semibold text-foreground" : "text-2xl font-semibold text-gray-900"}>Public collection link</h2>
            {isSunset ? <MemorialContactLinkFormDemo /> : <ContactLinkFormDemo />}
          </section>

          <section className="space-y-4" id="workspace">
            <h2 className={isSunset ? "text-2xl font-semibold text-foreground" : "text-2xl font-semibold text-gray-900"}>Dashboard tools & tokens</h2>
            <p className={isSunset ? "max-w-3xl text-sm text-muted-foreground" : "max-w-3xl text-sm text-gray-600"}>
              Shortcuts, wallet math, Discord and Slack payloads, and the plan capability view, all mirrored from signed-in
              experiences.
            </p>
            <PlaygroundAccountTools />
          </section>

          <section className="space-y-4" id="emergency">
            <h2 className={isSunset ? "text-2xl font-semibold text-foreground" : "text-2xl font-semibold text-gray-900"}>Emergency & install</h2>
            <p className={isSunset ? "max-w-3xl text-sm text-muted-foreground" : "max-w-3xl text-sm text-gray-600"}>
              Hold-to-send gesture, onboarding tour, and progressive web app guidance match what members configure after login.
            </p>
            <PlaygroundSosPwaSection />
          </section>

          <div className={isSunset ? "sunset-panel flex flex-col items-center justify-center gap-4 rounded-2xl border border-primary/35 bg-primary/12 p-8 text-center text-foreground" : "flex flex-col items-center justify-center gap-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-500 to-rose-500 p-8 text-center text-white"}>
            <p className="text-lg font-semibold">{isSunset ? "Ready to use Sunset for real memorial communication?" : "Ready to use Sunrise for real events?"}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant={isSunset ? "default" : "secondary"} className={isSunset ? "bg-primary text-primary-foreground hover:bg-primary/90" : undefined}>
                <Link href="/register">Create free account</Link>
              </Button>
              <Button asChild variant="outline" className={isSunset ? "border-primary/35 text-primary hover:bg-primary/10" : "border-white/80 bg-transparent text-white hover:bg-white/10"}>
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
