// Discord message templates for different event types
// Uses Discord's rich embed format for better presentation

export type DiscordTemplateVars = {
  firstName?: string
  lastName?: string
  eventTitle?: string
  eventDescription?: string
  eventDate?: string
  eventLocation?: string
  eventCategory?: string
  scheduledSendTime?: string
  hostName?: string
  customMessage?: string
  contactPhone?: string
  contactCategory?: string
  contactNotes?: string
}

export interface DiscordTemplate {
  key: string
  label: string
  template: (vars: DiscordTemplateVars) => DiscordEmbed
}

export interface DiscordEmbed {
  embeds: Array<{
    title?: string
    description?: string
    color?: number
    fields?: Array<{
      name: string
      value: string
      inline?: boolean
    }>
    footer?: {
      text: string
    }
    timestamp?: string
    thumbnail?: {
      url: string
    }
  }>
}

export const discordTemplates: DiscordTemplate[] = [
  {
    key: "birthday",
    label: "Birthday Party",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }) => ({
      embeds: [{
        title: `🎉 Birthday Invitation${firstName ? ` for ${firstName}` : ''}!`,
        description: eventDescription || "You're invited to celebrate with us!",
        color: 0xFF6B6B, // Coral red
        fields: [
          {
            name: "🎂 Event",
            value: eventTitle || "Birthday Party",
            inline: true
          },
          {
            name: "📅 Date",
            value: eventDate || "TBA",
            inline: true
          },
          {
            name: "📍 Location",
            value: eventLocation || "TBA",
            inline: true
          }
        ],
        footer: {
          text: `Best regards, ${hostName || 'The Host'}`
        },
        timestamp: new Date().toISOString()
      }]
    })
  },
  {
    key: "openHouse",
    label: "Open House",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }) => ({
      embeds: [{
        title: "🏡 Open House Invitation",
        description: eventDescription || "You're cordially invited to our open house event!",
        color: 0x4ECDC4, // Turquoise
        fields: [
          {
            name: "🏠 Event",
            value: eventTitle || "Open House",
            inline: true
          },
          {
            name: "📅 Date",
            value: eventDate || "TBA",
            inline: true
          },
          {
            name: "📍 Location",
            value: eventLocation || "TBA",
            inline: true
          }
        ],
        footer: {
          text: `Best regards, ${hostName || 'The Host'}`
        },
        timestamp: new Date().toISOString()
      }]
    })
  },
  {
    key: "wedding",
    label: "Wedding",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }) => ({
      embeds: [{
        title: "💍 Wedding Invitation",
        description: eventDescription || "We are delighted to invite you to share in our joy as we celebrate our wedding day!",
        color: 0xFF69B4, // Hot pink
        fields: [
          {
            name: "💒 Event",
            value: eventTitle || "Wedding Ceremony",
            inline: true
          },
          {
            name: "📅 Date",
            value: eventDate || "TBA",
            inline: true
          },
          {
            name: "📍 Location",
            value: eventLocation || "TBA",
            inline: true
          }
        ],
        footer: {
          text: `With love, ${hostName || 'The Happy Couple'}`
        },
        timestamp: new Date().toISOString()
      }]
    })
  },
  {
    key: "meeting",
    label: "Business Meeting",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }) => ({
      embeds: [{
        title: "📅 Meeting Invitation",
        description: eventDescription || "You're invited to attend an important meeting.",
        color: 0x3498DB, // Blue
        fields: [
          {
            name: "💼 Meeting",
            value: eventTitle || "Business Meeting",
            inline: true
          },
          {
            name: "📅 Date",
            value: eventDate || "TBA",
            inline: true
          },
          {
            name: "📍 Location",
            value: eventLocation || "TBA",
            inline: true
          }
        ],
        footer: {
          text: `Best regards, ${hostName || 'Meeting Organizer'}`
        },
        timestamp: new Date().toISOString()
      }]
    })
  },
  {
    key: "babyShower",
    label: "Baby Shower",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }) => ({
      embeds: [{
        title: "👶 Baby Shower Invitation",
        description: eventDescription || "We're excited to invite you to celebrate the upcoming arrival of our little one!",
        color: 0x2ECC71, // Green
        fields: [
          {
            name: "🍼 Event",
            value: eventTitle || "Baby Shower",
            inline: true
          },
          {
            name: "📅 Date",
            value: eventDate || "TBA",
            inline: true
          },
          {
            name: "📍 Location",
            value: eventLocation || "TBA",
            inline: true
          }
        ],
        footer: {
          text: `Best wishes, ${hostName || 'The Parents-to-be'}`
        },
        timestamp: new Date().toISOString()
      }]
    })
  },
  {
    key: "generic",
    label: "Generic Event",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName, customMessage }) => ({
      embeds: [{
        title: "📧 Event Invitation",
        description: customMessage || eventDescription || "You're invited to join us for a special event!",
        color: 0xF39C12, // Orange
        fields: [
          {
            name: "🎉 Event",
            value: eventTitle || "Special Event",
            inline: true
          },
          {
            name: "📅 Date",
            value: eventDate || "TBA",
            inline: true
          },
          {
            name: "📍 Location",
            value: eventLocation || "TBA",
            inline: true
          }
        ],
        footer: {
          text: `Best regards, ${hostName || 'The Host'}`
        },
        timestamp: new Date().toISOString()
      }]
    })
  }
]

// Generic Discord template function
export const genericDiscordTemplate = ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName, customMessage }: DiscordTemplateVars): DiscordEmbed => ({
  embeds: [{
    title: "📧 Event Invitation",
    description: customMessage || eventDescription || "You're invited to join us for a special event!",
    color: 0xF39C12, // Orange
    fields: [
      {
        name: "🎉 Event",
        value: eventTitle || "Special Event",
        inline: true
      },
      {
        name: "📅 Date",
        value: eventDate || "TBA",
        inline: true
      },
      {
        name: "📍 Location",
        value: eventLocation || "TBA",
        inline: true
      }
    ],
    footer: {
      text: `Best regards, ${hostName || 'The Host'}`
    },
    timestamp: new Date().toISOString()
  }]
})

// Helper function to convert Discord embed to webhook payload
export const createDiscordWebhookPayload = (embed: DiscordEmbed, content?: string) => {
  return {
    content: content || "",
    embeds: embed.embeds
  }
} 