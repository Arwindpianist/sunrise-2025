// Telegram message templates for different event types
// Optimized for Telegram's text format with HTML parsing

export type TelegramTemplateVars = {
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

export interface TelegramTemplate {
  key: string
  label: string
  template: (vars: TelegramTemplateVars) => string
}

export const telegramTemplates: TelegramTemplate[] = [
  {
    key: "birthday",
    label: "Birthday Party",
    template: ({ firstName, eventTitle, eventDate, eventLocation, hostName }) => `
🎉 <b>Birthday Invitation!</b>

Hi ${firstName || 'there'}! 

You're invited to celebrate with us!

<b>Event:</b> ${eventTitle || 'Birthday Party'}
<b>Date:</b> ${eventDate || 'TBA'}
<b>Location:</b> ${eventLocation || 'TBA'}

Please RSVP and join us for a wonderful celebration! 🎂

Best regards,
${hostName || 'The Host'}
    `.trim()
  },
  {
    key: "openHouse",
    label: "Open House",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }) => `
🏡 <b>Open House Invitation</b>

Dear ${firstName || 'there'},

You're cordially invited to our open house event!

<b>Event:</b> ${eventTitle || 'Open House'}
<b>Date:</b> ${eventDate || 'TBA'}
<b>Location:</b> ${eventLocation || 'TBA'}

${eventDescription || 'Join us for a special viewing and celebration!'}

We look forward to seeing you there!

Best regards,
${hostName || 'The Host'}
    `.trim()
  },
  {
    key: "wedding",
    label: "Wedding",
    template: ({ firstName, eventTitle, eventDate, eventLocation, hostName }) => `
💍 <b>Wedding Invitation</b>

Dear ${firstName || 'there'},

We are delighted to invite you to share in our joy as we celebrate our wedding day!

<b>Event:</b> ${eventTitle || 'Wedding Ceremony'}
<b>Date:</b> ${eventDate || 'TBA'}
<b>Location:</b> ${eventLocation || 'TBA'}

Your presence would mean the world to us on this special day.

Please RSVP at your earliest convenience.

With love,
${hostName || 'The Happy Couple'}
    `.trim()
  },
  {
    key: "meeting",
    label: "Business Meeting",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }) => `
📅 <b>Meeting Invitation</b>

Hi ${firstName || 'there'},

You're invited to attend an important meeting.

<b>Meeting:</b> ${eventTitle || 'Business Meeting'}
<b>Date:</b> ${eventDate || 'TBA'}
<b>Location:</b> ${eventLocation || 'TBA'}

${eventDescription || 'Please come prepared with any relevant materials.'}

Looking forward to seeing you there!

Best regards,
${hostName || 'Meeting Organizer'}
    `.trim()
  },
  {
    key: "babyShower",
    label: "Baby Shower",
    template: ({ firstName, eventTitle, eventDate, eventLocation, hostName }) => `
👶 <b>Baby Shower Invitation</b>

Dear ${firstName || 'there'},

We're excited to invite you to celebrate the upcoming arrival of our little one!

<b>Event:</b> ${eventTitle || 'Baby Shower'}
<b>Date:</b> ${eventDate || 'TBA'}
<b>Location:</b> ${eventLocation || 'TBA'}

Join us for games, food, and lots of baby talk! 🍼

Please RSVP if you can make it.

Best wishes,
${hostName || 'The Parents-to-be'}
    `.trim()
  },
  {
    key: "generic",
    label: "Generic Event",
    template: ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName, customMessage }) => `
📧 <b>Event Invitation</b>

Hi ${firstName || 'there'}!

${customMessage || eventDescription || 'You\'re invited to join us for a special event!'}

<b>Event:</b> ${eventTitle || 'Special Event'}
<b>Date:</b> ${eventDate || 'TBA'}
<b>Location:</b> ${eventLocation || 'TBA'}

We hope you can make it!

Best regards,
${hostName || 'The Host'}
    `.trim()
  }
]

export const genericTelegramTemplate = ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName, customMessage }: TelegramTemplateVars) => `
📧 <b>Event Invitation</b>

Hi ${firstName || 'there'}!

${customMessage || eventDescription || 'You\'re invited to join us for a special event!'}

<b>Event:</b> ${eventTitle || 'Special Event'}
<b>Date:</b> ${eventDate || 'TBA'}
<b>Location:</b> ${eventLocation || 'TBA'}

We hope you can make it!

Best regards,
${hostName || 'The Host'}
`.trim() 