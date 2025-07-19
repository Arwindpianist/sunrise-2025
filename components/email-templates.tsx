// Email templates for different event types
// Company logo and info can be injected where marked

export type EmailTemplateVars = {
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

export const birthdayTemplate = ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }: EmailTemplateVars) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #fff7ed; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto;">
    <!-- Company Logo Here -->
    <h1 style="color: #ff9800; font-size: 2.2em; margin-bottom: 0.2em;">🎉 Happy Birthday${firstName ? `, ${firstName}` : ''}!</h1>
    <p style="font-size: 1.1em; color: #333;">You're invited to a special birthday celebration: <b>${eventTitle || 'Birthday Party'}</b></p>
    ${eventDescription ? `<p style="font-size: 1.1em; color: #555; margin: 1em 0;">${eventDescription}</p>` : ''}
    <p style="margin: 1.5em 0; font-size: 1.1em;">
      <b>Date:</b> ${eventDate || 'TBA'}<br/>
      <b>Location:</b> ${eventLocation || 'TBA'}
    </p>
    <p style="font-size: 1.1em; color: #555;">We hope you can join us for a day full of fun, laughter, and memories. Please RSVP!</p>
    <div style="margin-top: 2em; color: #888; font-size: 0.95em;">Best wishes,<br/>${hostName || 'Your Friend'}</div>
    <!-- Company Info Here -->
  </div>
`;

export const openHouseTemplate = ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }: EmailTemplateVars) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f0f9ff; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto;">
    <!-- Company Logo Here -->
    <h1 style="color: #0284c7; font-size: 2em; margin-bottom: 0.2em;">🏡 You're Invited: ${eventTitle || 'Open House'}</h1>
    <p style="font-size: 1.1em; color: #333;">Come explore your future home! Join us for an open house event.</p>
    ${eventDescription ? `<p style="font-size: 1.1em; color: #555; margin: 1em 0;">${eventDescription}</p>` : ''}
    <p style="margin: 1.5em 0; font-size: 1.1em;">
      <b>Date:</b> ${eventDate || 'TBA'}<br/>
      <b>Location:</b> ${eventLocation || 'TBA'}
    </p>
    <p style="font-size: 1.1em; color: #555;">We look forward to welcoming you. Refreshments will be served!</p>
    <div style="margin-top: 2em; color: #888; font-size: 0.95em;">Best regards,<br/>${hostName || 'The Team'}</div>
    <!-- Company Info Here -->
  </div>
`;

export const weddingTemplate = ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }: EmailTemplateVars) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #fff1f2; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto;">
    <!-- Company Logo Here -->
    <h1 style="color: #e11d48; font-size: 2.2em; margin-bottom: 0.2em;">💍 Wedding Invitation</h1>
    <p style="font-size: 1.1em; color: #333;">${firstName ? `Dear ${firstName},` : ''} You are cordially invited to celebrate our wedding: <b>${eventTitle || 'Our Special Day'}</b></p>
    ${eventDescription ? `<p style="font-size: 1.1em; color: #555; margin: 1em 0;">${eventDescription}</p>` : ''}
    <p style="margin: 1.5em 0; font-size: 1.1em;">
      <b>Date:</b> ${eventDate || 'TBA'}<br/>
      <b>Location:</b> ${eventLocation || 'TBA'}
    </p>
    <p style="font-size: 1.1em; color: #555;">We would be honored by your presence as we begin our new life together.</p>
    <div style="margin-top: 2em; color: #888; font-size: 0.95em;">With love,<br/>${hostName || 'The Couple'}</div>
    <!-- Company Info Here -->
  </div>
`;

export const meetingTemplate = ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName, customMessage }: EmailTemplateVars) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto;">
    <!-- Company Logo Here -->
    <h1 style="color: #6366f1; font-size: 2em; margin-bottom: 0.2em;">📅 Meeting Invitation</h1>
    <p style="font-size: 1.1em; color: #333;">${firstName ? `Hi ${firstName},` : ''} You are invited to a meeting: <b>${eventTitle || 'Meeting'}</b></p>
    ${eventDescription ? `<p style="font-size: 1.1em; color: #555; margin: 1em 0;">${eventDescription}</p>` : ''}
    <p style="margin: 1.5em 0; font-size: 1.1em;">
      <b>Date:</b> ${eventDate || 'TBA'}<br/>
      <b>Location:</b> ${eventLocation || 'TBA'}
    </p>
    <p style="font-size: 1.1em; color: #555;">${customMessage || eventDescription || 'Please let us know if you can attend.'}</p>
    <div style="margin-top: 2em; color: #888; font-size: 0.95em;">Best regards,<br/>${hostName || 'The Organizer'}</div>
    <!-- Company Info Here -->
  </div>
`;

export const babyShowerTemplate = ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName }: EmailTemplateVars) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f0fdf4; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto;">
    <!-- Company Logo Here -->
    <h1 style="color: #22c55e; font-size: 2em; margin-bottom: 0.2em;">👶 Baby Shower Invitation</h1>
    <p style="font-size: 1.1em; color: #333;">Join us for a joyful baby shower: <b>${eventTitle || 'Baby Shower'}</b></p>
    ${eventDescription ? `<p style="font-size: 1.1em; color: #555; margin: 1em 0;">${eventDescription}</p>` : ''}
    <p style="margin: 1.5em 0; font-size: 1.1em;">
      <b>Date:</b> ${eventDate || 'TBA'}<br/>
      <b>Location:</b> ${eventLocation || 'TBA'}
    </p>
    <p style="font-size: 1.1em; color: #555;">Let’s celebrate the upcoming arrival together!</p>
    <div style="margin-top: 2em; color: #888; font-size: 0.95em;">With love,<br/>${hostName || 'The Family'}</div>
    <!-- Company Info Here -->
  </div>
`;

export const genericTemplate = ({ firstName, eventTitle, eventDescription, eventDate, eventLocation, hostName, customMessage }: EmailTemplateVars) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #fff; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto;">
    <!-- Company Logo Here -->
    <h1 style="color: #f59e42; font-size: 2em; margin-bottom: 0.2em;">${eventTitle || 'You\'re Invited!'}</h1>
    <p style="font-size: 1.1em; color: #333;">${customMessage || eventDescription || 'Join us for a special event.'}</p>
    <p style="margin: 1.5em 0; font-size: 1.1em;">
      <b>Date:</b> ${eventDate || 'TBA'}<br/>
      <b>Location:</b> ${eventLocation || 'TBA'}
    </p>
    <div style="margin-top: 2em; color: #888; font-size: 0.95em;">Best regards,<br/>${hostName || 'The Team'}</div>
    <!-- Company Info Here -->
  </div>
`;

export const emailTemplates = [
  { key: 'birthday', label: 'Birthday', template: birthdayTemplate },
  { key: 'openHouse', label: 'Open House', template: openHouseTemplate },
  { key: 'wedding', label: 'Wedding', template: weddingTemplate },
  { key: 'meeting', label: 'Meeting', template: meetingTemplate },
  { key: 'babyShower', label: 'Baby Shower', template: babyShowerTemplate },
  { key: 'generic', label: 'Generic', template: genericTemplate },
]; 