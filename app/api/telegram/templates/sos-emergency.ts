// Emergency SOS Telegram Template
export const sosEmergencyTelegramTemplate = `
🚨 *EMERGENCY SOS ALERT* 🚨

⚠️ *URGENT: {{user_name}} needs IMMEDIATE assistance!*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *Emergency Details:*
• *Alert Time:* {{formatted_time}}
• *Priority Level:* Priority {{priority}}
• *Person in Need:* {{user_name}}
• *Contact Phone:* {{user_phone}}
• *Emergency ID:* {{sos_alert_id}}

📍 *Location:*
{{location}}
{{#if location_url}}
🗺️ [Open in Google Maps]({{location_url}})
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 *IMMEDIATE ACTION REQUIRED:*

1️⃣ *Call immediately:* {{user_phone}}
2️⃣ *Check location:* {{location}}
3️⃣ *Get help if needed*
4️⃣ *Update alert status when you respond*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 *Quick Actions:*
• [View Emergency Details]({{site_url}}/dashboard/sos?alert={{sos_alert_id}})
• [Call Now](tel:{{user_phone}})

⚠️ *This is a critical emergency that requires your immediate attention and response.*

*If you cannot respond, please contact other emergency contacts immediately.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Sent via Sunrise Emergency System*
`

// Telegram inline keyboard for emergency actions
export const sosEmergencyKeyboard = {
  inline_keyboard: [
    [
      {
        text: "🚨 VIEW EMERGENCY",
        url: "{{site_url}}/dashboard/sos?alert={{sos_alert_id}}"
      },
      {
        text: "📞 CALL NOW",
        url: "tel:{{user_phone}}"
      }
    ],
    [
      {
        text: "✓ I'M RESPONDING",
        callback_data: "sos_acknowledge_{{sos_alert_id}}"
      },
      {
        text: "🗺️ OPEN MAPS",
        url: "{{location_url}}"
      }
    ],
    [
      {
        text: "📋 VIEW DETAILS",
        callback_data: "sos_details_{{sos_alert_id}}"
      }
    ]
  ]
}

// SMS template for emergency notifications
export const sosEmergencySMSTemplate = `
🚨 EMERGENCY SOS ALERT 🚨

URGENT: {{user_name}} needs IMMEDIATE assistance!

Time: {{formatted_time}}
Priority: {{priority}}
Phone: {{user_phone}}
Location: {{location}}

{{#if location_url}}
Map: {{location_url}}
{{/if}}

CALL IMMEDIATELY: {{user_phone}}

Alert ID: {{sos_alert_id}}

This is a critical emergency requiring immediate response.
`

// WhatsApp template for emergency notifications
export const sosEmergencyWhatsAppTemplate = `
🚨 *EMERGENCY SOS ALERT* 🚨

⚠️ *URGENT: {{user_name}} needs IMMEDIATE assistance!*

*Emergency Details:*
• Time: {{formatted_time}}
• Priority: {{priority}}
• Phone: {{user_phone}}
• Location: {{location}}

{{#if location_url}}
📍 Location: {{location_url}}
{{/if}}

*IMMEDIATE ACTION REQUIRED:*
1. Call {{user_phone}} immediately
2. Check location: {{location}}
3. Get help if needed

Alert ID: {{sos_alert_id}}

*This is a critical emergency requiring immediate response.*
`
