// Emergency SOS Email Template
export const sosEmergencyEmailTemplate = {
  subject: '🚨 EMERGENCY SOS ALERT - {{user_name}} needs immediate assistance!',
  
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Emergency SOS Alert</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .emergency-header {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 12px 12px 0 0;
          margin-bottom: 0;
        }
        .emergency-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .emergency-header .subtitle {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .alert-content {
          background: white;
          padding: 30px;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .critical-info {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        .info-item {
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #dc2626;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          color: #111827;
          font-size: 16px;
          margin-top: 5px;
        }
        .location-section {
          background: #eff6ff;
          border: 2px solid #bfdbfe;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .location-link {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 10px;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .action-button {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 0 10px;
          font-size: 16px;
        }
        .action-button.secondary {
          background: #6b7280;
        }
        .priority-badge {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
        }
        .urgent-notice {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .urgent-notice h3 {
          margin: 0 0 10px 0;
          color: #92400e;
          font-size: 18px;
        }
        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          .action-button {
            display: block;
            margin: 10px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="emergency-header">
        <h1>🚨 EMERGENCY SOS ALERT</h1>
        <p class="subtitle">IMMEDIATE ACTION REQUIRED</p>
      </div>
      
      <div class="alert-content">
        <div class="urgent-notice">
          <h3>⚠️ URGENT: {{user_name}} needs immediate assistance!</h3>
          <p><strong>This is a critical emergency alert that requires your immediate attention and response.</strong></p>
        </div>

        <div class="critical-info">
          <h2 style="margin: 0 0 15px 0; color: #dc2626;">Emergency Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Alert Time</div>
              <div class="info-value">{{formatted_time}}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Priority Level</div>
              <div class="info-value">
                <span class="priority-badge">Priority {{priority}}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Person in Need</div>
              <div class="info-value">{{user_name}}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contact Phone</div>
              <div class="info-value">{{user_phone}}</div>
            </div>
          </div>
        </div>

        <div class="location-section">
          <h3 style="margin: 0 0 15px 0; color: #1e40af;">📍 Emergency Location</h3>
          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">{{location}}</p>
          {{#if location_url}}
          <a href="{{location_url}}" class="location-link" target="_blank">
            🗺️ Open in Google Maps
          </a>
          {{/if}}
        </div>

        <div class="action-buttons">
          <a href="{{site_url}}/dashboard/sos?alert={{sos_alert_id}}" class="action-button">
            🚨 VIEW EMERGENCY DETAILS
          </a>
          <a href="tel:{{user_phone}}" class="action-button secondary">
            📞 CALL NOW
          </a>
        </div>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #374151;">What to do next:</h4>
          <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
            <li><strong>Respond immediately</strong> - This is a critical emergency</li>
            <li><strong>Call the person</strong> - Use the phone number provided above</li>
            <li><strong>Check the location</strong> - Use the map link to find them</li>
            <li><strong>Get help if needed</strong> - Call emergency services if necessary</li>
            <li><strong>Update the alert</strong> - Mark as acknowledged when you respond</li>
          </ol>
        </div>

        <div class="footer">
          <p><strong>Emergency Alert ID:</strong> {{sos_alert_id}}</p>
          <p>This alert was sent via Sunrise Emergency System</p>
          <p>If you cannot respond, please contact other emergency contacts immediately</p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  text: `
🚨 EMERGENCY SOS ALERT 🚨

URGENT: {{user_name}} needs immediate assistance!

EMERGENCY DETAILS:
- Alert Time: {{formatted_time}}
- Priority Level: Priority {{priority}}
- Person in Need: {{user_name}}
- Contact Phone: {{user_phone}}
- Location: {{location}}

{{#if location_url}}
📍 LOCATION: {{location_url}}
{{/if}}

IMMEDIATE ACTION REQUIRED:
1. Call {{user_phone}} immediately
2. Check location: {{location}}
3. Get help if needed
4. Update alert status when you respond

Emergency Alert ID: {{sos_alert_id}}

This alert was sent via Sunrise Emergency System.
If you cannot respond, contact other emergency contacts immediately.
  `
}
