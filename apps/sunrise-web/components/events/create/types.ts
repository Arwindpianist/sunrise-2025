export type SendOption = "now" | "schedule"

export type CreateEventForm = {
  title: string
  description: string
  eventDate: string
  location: string
  categoryId: string
  emailSubject: string
  emailTemplate: string
  sendOption: SendOption
  scheduledSendTime: string
}

export type ContactCategory = {
  id: string
  name: string
  color?: string
}

