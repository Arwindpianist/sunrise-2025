"use client"

import { useMemo, useState } from "react"
import { Mail, MessageCircle, Send } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  buildEmailChannelPreviewHtml,
  buildTelegramChannelPreviewHtml,
  buildWhatsappChannelPreviewHtml,
  type EmailPreviewVariant,
} from "@/components/public/demo/sample-preview-html"

type Props = {
  className?: string
  heading?: string
  subheading?: string
}

const panelMotion =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:zoom-in-[0.995] motion-safe:duration-400 motion-safe:ease-out"

/** Fixed viewport height so iframe content never scrolls; scales with svh on phones and caps on desktop. */
const iframeViewport =
  "mx-auto block h-[clamp(220px,36svh,340px)] w-full max-h-[min(52svh,380px)] border-0 bg-transparent sm:h-[clamp(240px,34svh,360px)] lg:h-[clamp(260px,32svh,380px)]"

export default function MessageChannelPreviewSection({
  className,
  heading = "Preview your message",
  subheading = "Same template story, tailored for each channel; switch tabs to see designed previews for email, WhatsApp-style chat, and Telegram.",
}: Props) {
  const [channel, setChannel] = useState("email")
  const [emailVariant, setEmailVariant] = useState<EmailPreviewVariant>("wedding")

  const emailSrcDoc = useMemo(() => buildEmailChannelPreviewHtml(emailVariant), [emailVariant])
  const whatsappSrcDoc = useMemo(() => buildWhatsappChannelPreviewHtml(), [])
  const telegramSrcDoc = useMemo(() => buildTelegramChannelPreviewHtml(), [])

  const previewKey =
    channel === "email" ? `email-${emailVariant}` : channel === "whatsapp" ? "whatsapp" : "telegram"

  return (
    <section className={className}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">{heading}</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{subheading}</p>
      </div>

      <Tabs value={channel} onValueChange={setChannel} className="mt-6">
        <TabsList className="mx-auto grid h-auto w-full max-w-md grid-cols-3 motion-safe:transition-shadow motion-safe:duration-300">
          <TabsTrigger
            value="email"
            className="gap-1.5 motion-safe:transition-all motion-safe:duration-200 data-[state=active]:scale-[1.02]"
          >
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="gap-1.5 motion-safe:transition-all motion-safe:duration-200 data-[state=active]:scale-[1.02]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger
            value="telegram"
            className="gap-1.5 motion-safe:transition-all motion-safe:duration-200 data-[state=active]:scale-[1.02]"
          >
            <Send className="h-4 w-4" />
            Telegram
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div key={previewKey} className={cn("mt-4", panelMotion)}>
        {channel === "email" ? (
          <Card className="overflow-hidden border-orange-100 bg-white/95 p-4 shadow-sm motion-safe:transition-all motion-safe:duration-300">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Email design</Label>
                <Select
                  value={emailVariant}
                  onValueChange={(v) => setEmailVariant(v as EmailPreviewVariant)}
                >
                  <SelectTrigger className="w-full max-w-xs motion-safe:transition-all motion-safe:duration-200 hover:border-orange-200/80">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Subject:{" "}
                <span className="font-medium text-foreground">
                  You&apos;re invited: Summer Celebration
                </span>
              </p>
            </div>
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border border-orange-100/80 bg-[#f6f8fc] shadow-inner",
                "motion-safe:transition-[box-shadow] motion-safe:duration-300",
              )}
            >
              <iframe
                title="Email design preview"
                className={cn(iframeViewport, "rounded-2xl")}
                srcDoc={emailSrcDoc}
                sandbox="allow-same-origin"
                scrolling="no"
              />
            </div>
          </Card>
        ) : null}

        {channel === "whatsapp" ? (
          <Card className="overflow-hidden border-emerald-950/30 bg-gradient-to-b from-[#1a282f] to-[#0f1a1f] p-3 shadow-xl motion-safe:transition-all motion-safe:duration-300">
            <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-emerald-400/90">
              WhatsApp-style preview
            </p>
            <div className="relative mx-auto w-full max-w-[min(100%,340px)] overflow-hidden rounded-[28px] bg-black/40 p-1 shadow-2xl ring-1 ring-white/10">
              <iframe
                title="WhatsApp-style preview"
                className={cn(iframeViewport, "rounded-[24px]")}
                srcDoc={whatsappSrcDoc}
                sandbox="allow-same-origin"
                scrolling="no"
              />
            </div>
          </Card>
        ) : null}

        {channel === "telegram" ? (
          <Card className="overflow-hidden border-sky-200/80 bg-gradient-to-b from-sky-100 to-sky-200/40 p-3 shadow-lg motion-safe:transition-all motion-safe:duration-300">
            <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-sky-800/90">
              Telegram-style preview
            </p>
            <div className="relative mx-auto w-full max-w-[min(100%,340px)] overflow-hidden rounded-[28px] bg-sky-900/10 p-1 shadow-xl ring-1 ring-sky-900/10">
              <iframe
                title="Telegram-style preview"
                className={cn(iframeViewport, "rounded-[24px]")}
                srcDoc={telegramSrcDoc}
                sandbox="allow-same-origin"
                scrolling="no"
              />
            </div>
          </Card>
        ) : null}
      </div>
    </section>
  )
}
