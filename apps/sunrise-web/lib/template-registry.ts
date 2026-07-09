import { emailTemplates } from "@/components/email-templates"
import { telegramTemplates } from "@/components/telegram-templates"
import { discordTemplates } from "@/components/discord-templates"
import { slackTemplates } from "@/components/slack-templates"

export type TemplateChannel = "email" | "telegram" | "discord" | "slack"

type TemplateMeta = {
  key: string
  label: string
}

const channelTemplates: Record<TemplateChannel, TemplateMeta[]> = {
  email: emailTemplates.map((template) => ({ key: template.key, label: template.label })),
  telegram: telegramTemplates.map((template) => ({ key: template.key, label: template.label })),
  discord: discordTemplates.map((template) => ({ key: template.key, label: template.label })),
  slack: slackTemplates.map((template) => ({ key: template.key, label: template.label })),
}

export function getTemplatesByChannel(channel: TemplateChannel) {
  return channelTemplates[channel]
}

