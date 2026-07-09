"use client"

import { useMemo, useState } from "react"
import { Mail, MessageCircle, Send } from "lucide-react"
import {
  Card,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
} from "@repo/ui"
import {
  buildMemorialEmailChannelPreviewHtml,
  buildMemorialTelegramChannelPreviewHtml,
  buildMemorialWhatsappChannelPreviewHtml,
  MEMORIAL_SAMPLE,
  type MemorialEmailVariant,
} from "../memorial-preview-html"

type Props = {
  className?: string
}

const panelMotion =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:zoom-in-[0.995] motion-safe:duration-400 motion-safe:ease-out"

const iframeViewport =
  "mx-auto block h-[clamp(220px,36svh,340px)] w-full max-h-[min(52svh,380px)] border-0 bg-transparent sm:h-[clamp(240px,34svh,360px)] lg:h-[clamp(260px,32svh,380px)]"

export function MemorialMessageChannelPreview({ className }: Props) {
  const [channel, setChannel] = useState("email")
  const [emailVariant, setEmailVariant] = useState<MemorialEmailVariant>("service")

  const emailSrcDoc = useMemo(() => buildMemorialEmailChannelPreviewHtml(emailVariant), [emailVariant])
  const whatsappSrcDoc = useMemo(() => buildMemorialWhatsappChannelPreviewHtml(), [])
  const telegramSrcDoc = useMemo(() => buildMemorialTelegramChannelPreviewHtml(), [])

  const previewKey =
    channel === "email" ? `email-${emailVariant}` : channel === "whatsapp" ? "whatsapp" : "telegram"

  const subjectLine =
    emailVariant === "condolence"
      ? `With sympathy - ${MEMORIAL_SAMPLE.honoreeName}`
      : emailVariant === "gathering"
        ? `Private gathering - ${MEMORIAL_SAMPLE.honoreeName}`
        : `Arrangements: ${MEMORIAL_SAMPLE.honoreeName}`

  return (
    <section className={className}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">Preview your message</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Calm, respectful layouts for email and messaging channels. Switch tabs to compare how the same notice reads on each
          surface.
        </p>
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
          <Card className="sunset-panel overflow-hidden border-border bg-card/85 p-4 shadow-sm motion-safe:transition-all motion-safe:duration-300">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Email template</Label>
                <Select value={emailVariant} onValueChange={(v) => setEmailVariant(v as MemorialEmailVariant)}>
                  <SelectTrigger className="w-full max-w-xs motion-safe:transition-all motion-safe:duration-200 hover:border-primary/40">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service announcement</SelectItem>
                    <SelectItem value="condolence">Condolence note</SelectItem>
                    <SelectItem value="gathering">Private gathering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Subject: <span className="font-medium text-foreground">{subjectLine}</span>
              </p>
            </div>
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border border-border bg-background/60 shadow-inner ring-1 ring-primary/15",
                "motion-safe:transition-shadow motion-safe:duration-300",
              )}
            >
              <iframe
                title="Memorial email preview"
                className={cn(iframeViewport, "rounded-2xl")}
                srcDoc={emailSrcDoc}
                sandbox="allow-same-origin"
                scrolling="no"
              />
            </div>
          </Card>
        ) : null}

        {channel === "whatsapp" ? (
          <Card className="sunset-panel overflow-hidden border-border bg-card/85 p-3 shadow-sm motion-safe:transition-all motion-safe:duration-300">
            <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              WhatsApp-style preview
            </p>
            <div className="relative mx-auto w-full max-w-[min(100%,340px)] overflow-hidden rounded-[28px] bg-black/30 p-1 shadow-2xl ring-1 ring-border">
              <iframe
                title="Memorial WhatsApp preview"
                className={cn(iframeViewport, "rounded-[24px]")}
                srcDoc={whatsappSrcDoc}
                sandbox="allow-same-origin"
                scrolling="no"
              />
            </div>
          </Card>
        ) : null}

        {channel === "telegram" ? (
          <Card className="sunset-panel overflow-hidden border-border bg-card/85 p-3 shadow-sm motion-safe:transition-all motion-safe:duration-300">
            <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Telegram-style preview
            </p>
            <div className="relative mx-auto w-full max-w-[min(100%,340px)] overflow-hidden rounded-[28px] bg-muted/30 p-1 shadow-xl ring-1 ring-border">
              <iframe
                title="Memorial Telegram preview"
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
