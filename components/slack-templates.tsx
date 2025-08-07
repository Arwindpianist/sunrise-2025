export interface SlackTemplateVars {
  firstName: string
  eventTitle: string
  eventDescription: string
  eventDate: string
  eventLocation: string
  hostName: string
  customMessage: string
}

export interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  fields?: Array<{
    type: string
    text: string
    emoji?: boolean
  }>
  elements?: any[]
  accessory?: any
}

export interface SlackMessage {
  text?: string
  blocks?: SlackBlock[]
}

export const slackTemplates = [
  {
    key: "birthday",
    label: "Birthday Party",
    template: (vars: SlackTemplateVars): SlackMessage => ({
      text: `🎉 *${vars.eventTitle}*`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🎉 ${vars.eventTitle}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: vars.eventDescription || "You're invited to a birthday celebration!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*📅 Date:*\n${vars.eventDate}`
            },
            {
              type: "mrkdwn",
              text: `*📍 Location:*\n${vars.eventLocation || "TBA"}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Hosted by:* ${vars.hostName}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "🎂 *Please RSVP to confirm your attendance!*"
            }
          ]
        }
      ]
    })
  },
  {
    key: "openHouse",
    label: "Open House",
    template: (vars: SlackTemplateVars): SlackMessage => ({
      text: `🏡 *${vars.eventTitle}*`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🏡 ${vars.eventTitle}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: vars.eventDescription || "Join us for an open house viewing!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*📅 Date:*\n${vars.eventDate}`
            },
            {
              type: "mrkdwn",
              text: `*📍 Location:*\n${vars.eventLocation || "TBA"}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Hosted by:* ${vars.hostName}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "🏠 *Perfect opportunity to explore the property!*"
            }
          ]
        }
      ]
    })
  },
  {
    key: "wedding",
    label: "Wedding",
    template: (vars: SlackTemplateVars): SlackMessage => ({
      text: `💍 *${vars.eventTitle}*`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `💍 ${vars.eventTitle}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: vars.eventDescription || "You're cordially invited to celebrate our special day!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*📅 Date:*\n${vars.eventDate}`
            },
            {
              type: "mrkdwn",
              text: `*📍 Venue:*\n${vars.eventLocation || "TBA"}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Hosted by:* ${vars.hostName}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "💒 *Please RSVP to help us plan our special day!*"
            }
          ]
        }
      ]
    })
  },
  {
    key: "meeting",
    label: "Business Meeting",
    template: (vars: SlackTemplateVars): SlackMessage => ({
      text: `📅 *${vars.eventTitle}*`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `📅 ${vars.eventTitle}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: vars.eventDescription || "Business meeting invitation"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*📅 Date:*\n${vars.eventDate}`
            },
            {
              type: "mrkdwn",
              text: `*📍 Location:*\n${vars.eventLocation || "TBA"}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Organized by:* ${vars.hostName}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "💼 *Please confirm your attendance!*"
            }
          ]
        }
      ]
    })
  },
  {
    key: "babyShower",
    label: "Baby Shower",
    template: (vars: SlackTemplateVars): SlackMessage => ({
      text: `👶 *${vars.eventTitle}*`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `👶 ${vars.eventTitle}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: vars.eventDescription || "Join us for a baby shower celebration!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*📅 Date:*\n${vars.eventDate}`
            },
            {
              type: "mrkdwn",
              text: `*📍 Location:*\n${vars.eventLocation || "TBA"}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Hosted by:* ${vars.hostName}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "🎁 *Please RSVP to help us prepare for the celebration!*"
            }
          ]
        }
      ]
    })
  },
  {
    key: "generic",
    label: "Generic Event",
    template: (vars: SlackTemplateVars): SlackMessage => ({
      text: `📧 *${vars.eventTitle}*`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `📧 ${vars.eventTitle}`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: vars.eventDescription || "You're invited to an event!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*📅 Date:*\n${vars.eventDate}`
            },
            {
              type: "mrkdwn",
              text: `*📍 Location:*\n${vars.eventLocation || "TBA"}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Hosted by:* ${vars.hostName}`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "📋 *Please RSVP to confirm your attendance!*"
            }
          ]
        }
      ]
    })
  }
]

export const createSlackWebhookPayload = (message: SlackMessage): any => {
  return {
    text: message.text,
    blocks: message.blocks
  }
} 