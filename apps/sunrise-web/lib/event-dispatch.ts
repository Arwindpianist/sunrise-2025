type DispatchOptions = {
  sendEmail?: boolean
  sendTelegram?: boolean
  sendDiscord?: boolean
  sendSlack?: boolean
}

const callEndpoint = async (url: string, eventId: string, label: string) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.error || `Failed to send ${label}`)
  }
}

export async function dispatchEventChannels(eventId: string, options: DispatchOptions) {
  if (options.sendEmail) {
    await callEndpoint("/api/email/send", eventId, "emails")
  }
  if (options.sendTelegram) {
    await callEndpoint("/api/telegram/send", eventId, "Telegram messages")
  }
  if (options.sendDiscord) {
    await callEndpoint("/api/discord/send-event", eventId, "Discord messages")
  }
  if (options.sendSlack) {
    await callEndpoint("/api/slack/send-event", eventId, "Slack messages")
  }
}

