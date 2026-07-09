import { format } from "date-fns"
import { emailTemplates } from "@/components/email-templates"

const SAMPLE = {
  eventTitle: "Summer Celebration",
  eventDescription: "Join us for food, music, and RSVP in your Sunrise invite.",
  eventDate: new Date(new Date().setDate(new Date().getDate() + 21)),
  eventLocation: "Riverside Community Hall",
  hostName: "Sunrise Events",
  guestName: "Alex",
}

function eventDateFormatted() {
  return format(SAMPLE.eventDate, "EEEE, MMMM do yyyy, h:mm a")
}

/** Wraps raw invitation HTML for iframe preview: fits viewport, no scroll, Gmail-style chrome. */
export function wrapEmailHtmlForPreview(innerHtml: string): string {
  const subject = `You're invited: ${SAMPLE.eventTitle}`
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><style>
    html, body { height: 100%; margin: 0; overflow: hidden; -webkit-text-size-adjust: 100%; }
    .g-root { display: flex; flex-direction: column; height: 100%; max-height: 100%; background: #f6f8fc; }
    .g-top { flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border-bottom: 1px solid #dadce0; font-size: 11px; color: #5f6368; }
    .g-top svg { flex-shrink: 0; opacity: 0.8; }
    .g-subject { flex-shrink: 0; padding: 8px 12px; background: #fff; font-size: 12px; font-weight: 600; color: #202124; border-bottom: 1px solid #f1f3f4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .g-meta { flex-shrink: 0; padding: 6px 12px; font-size: 10px; color: #5f6368; background: #fff; border-bottom: 1px solid #eceff1; }
    .fit-area {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 6px 8px 8px;
      display: flex;
      justify-content: center;
      align-items: stretch;
      background: linear-gradient(180deg, #eef1f6 0%, #e8eaed 100%);
    }
    .email-preview {
      flex: 1;
      min-height: 0;
      width: 100%;
      max-width: 100%;
      overflow: hidden !important;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgba(60,64,67,.25), 0 2px 8px rgba(60,64,67,.12);
      background: #fff;
      display: flex;
      flex-direction: column;
    }
    .email-preview > div {
      flex: 1;
      min-height: 0;
      overflow: hidden !important;
      padding: clamp(10px, 2.5vmin, 16px) clamp(12px, 3vmin, 18px) !important;
      margin: 0 auto !important;
      max-width: 100% !important;
      border-radius: 0 !important;
      box-sizing: border-box !important;
    }
    .email-preview > div h1 {
      font-size: clamp(13px, 4vmin, 17px) !important;
      line-height: 1.2 !important;
      margin: 0 0 clamp(6px, 1.5vmin, 10px) !important;
      font-weight: 700 !important;
    }
    .email-preview > div p {
      font-size: clamp(10px, 3vmin, 12px) !important;
      line-height: 1.38 !important;
      margin: clamp(4px, 1vmin, 8px) 0 !important;
      color: inherit !important;
    }
    .email-preview > div div[style*="margin-top"] { margin-top: 8px !important; }
  </style></head><body>
  <div class="g-root">
    <div class="g-top">
      <span aria-hidden="true">&#9776;</span>
      <span>Inbox</span>
      <span style="opacity:.5">/</span>
      <span style="color:#1a73e8;font-weight:500">Sunrise</span>
    </div>
    <div class="g-subject">${escapeHtml(subject)}</div>
    <div class="g-meta">From &lt;events@sunrise-2025.com&gt; · to ${escapeHtml(SAMPLE.guestName)}</div>
    <div class="fit-area">
      <div class="email-preview">${innerHtml}</div>
    </div>
  </div>
</body></html>`
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export type EmailPreviewVariant = "wedding" | "birthday" | "generic"

export function buildEmailChannelPreviewHtml(variant: EmailPreviewVariant = "wedding") {
  const def = emailTemplates.find((t) => t.key === variant) ?? emailTemplates.find((t) => t.key === "generic")
  const html =
    def?.template({
      firstName: SAMPLE.guestName,
      eventTitle: SAMPLE.eventTitle,
      eventDescription: SAMPLE.eventDescription,
      eventDate: eventDateFormatted(),
      eventLocation: SAMPLE.eventLocation,
      hostName: SAMPLE.hostName,
      customMessage: SAMPLE.eventDescription,
    }) ?? ""
  return wrapEmailHtmlForPreview(html)
}

export function buildWhatsappChannelPreviewHtml() {
  const when = format(SAMPLE.eventDate, "EEE d MMM · h:mm a")
  const shortDesc =
    SAMPLE.eventDescription.length > 120 ? SAMPLE.eventDescription.slice(0, 117) + "…" : SAMPLE.eventDescription
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><style>
    html, body { height: 100%; margin: 0; overflow: hidden; -webkit-text-size-adjust: 100%; }
    * { box-sizing: border-box; }
    .wa {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 100%;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: #0b141a;
      color: #e9edef;
    }
    .wa-status {
      flex-shrink: 0;
      height: clamp(18px, 5vmin, 22px);
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: clamp(9px, 2.6vmin, 11px);
      color: #aebac1;
      background: #1f2c33;
    }
    .wa-head {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: clamp(6px, 2vmin, 10px);
      padding: clamp(6px, 2vmin, 10px);
      background: #1f2c33;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .wa-back {
      width: clamp(26px, 8vmin, 34px);
      height: clamp(26px, 8vmin, 34px);
      border-radius: 50%;
      background: rgba(255,255,255,.06);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(14px, 4vmin, 18px);
      color: #aebac1;
    }
    .wa-av {
      width: clamp(34px, 10vmin, 42px);
      height: clamp(34px, 10vmin, 42px);
      border-radius: 50%;
      background: linear-gradient(145deg, #25d366, #128c7e);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: clamp(12px, 3.5vmin, 15px);
      color: #fff;
      flex-shrink: 0;
    }
    .wa-title-wrap { flex: 1; min-width: 0; }
    .wa-title { font-size: clamp(13px, 3.8vmin, 16px); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wa-sub { font-size: clamp(10px, 2.8vmin, 12px); color: #8696a0; margin-top: 2px; }
    .wa-actions { display: flex; gap: 12px; color: #aebac1; font-size: clamp(14px, 4vmin, 18px); flex-shrink: 0; padding-right: 4px; }
    .wa-chat {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: clamp(8px, 2.5vmin, 12px);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      background-color: #0b141a;
      background-image: repeating-linear-gradient(135deg, rgba(255,255,255,.018) 0 1px, transparent 1px 14px);
    }
    .wa-date-pill {
      align-self: center;
      flex-shrink: 0;
      margin-bottom: clamp(6px, 2vmin, 10px);
      padding: 3px 10px;
      border-radius: 8px;
      background: rgba(31,44,52,.85);
      font-size: clamp(9px, 2.6vmin, 11px);
      color: #aebac1;
    }
    .wa-row { display: flex; justify-content: flex-end; align-items: flex-end; gap: 6px; }
    .wa-bubble {
      max-width: min(92%, 280px);
      background: linear-gradient(180deg, #005c4b 0%, #064e44 100%);
      color: #e9edef;
      border-radius: 10px 10px 2px 10px;
      padding: clamp(8px, 2.2vmin, 11px) clamp(10px, 2.8vmin, 12px);
      box-shadow: 0 1px 0.5px rgba(0,0,0,.28);
      font-size: clamp(11px, 3.2vmin, 13px);
      line-height: 1.42;
    }
    .wa-bubble strong { display: block; font-size: clamp(12px, 3.4vmin, 14px); margin-bottom: 4px; font-weight: 600; }
    .wa-meta { margin-top: 6px; font-size: clamp(9px, 2.6vmin, 11px); opacity: .85; color: #aec9c4; }
    .wa-foot {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: clamp(6px, 2vmin, 9px) 10px;
      background: #1f2c33;
      border-top: 1px solid rgba(255,255,255,.06);
      font-size: clamp(11px, 3vmin, 13px);
      color: #8696a0;
    }
    .wa-input-fake { flex: 1; background: #2a3942; border-radius: 20px; padding: 8px 14px; font-size: clamp(11px, 3vmin, 13px); color: #8696a0; }
  </style></head><body>
  <div class="wa">
    <div class="wa-status"><span>10:02</span><span>&#128246; &#128246; &#128267;</span></div>
    <div class="wa-head">
      <div class="wa-back">&#8592;</div>
      <div class="wa-av">S</div>
      <div class="wa-title-wrap">
        <div class="wa-title">${escapeHtml(SAMPLE.eventTitle)}</div>
        <div class="wa-sub">business · tap for info</div>
      </div>
      <div class="wa-actions"><span>&#128222;</span><span>&#8942;</span></div>
    </div>
    <div class="wa-chat">
      <div class="wa-date-pill">Today</div>
      <div class="wa-row">
        <div class="wa-bubble">
          <strong>${escapeHtml(SAMPLE.eventTitle)}</strong>
          Hi ${escapeHtml(SAMPLE.guestName)}, ${escapeHtml(shortDesc)}
          <div class="wa-meta">${escapeHtml(when)} · ${escapeHtml(SAMPLE.eventLocation)}</div>
        </div>
      </div>
    </div>
    <div class="wa-foot">
      <span style="font-size:18px">&#128522;</span>
      <div class="wa-input-fake">Message</div>
      <span style="font-size:18px;color:#8696a0">&#128266;</span>
    </div>
  </div>
</body></html>`
}

export function buildTelegramChannelPreviewHtml() {
  const when = format(SAMPLE.eventDate, "MMM d · HH:mm")
  const shortDesc =
    SAMPLE.eventDescription.length > 110 ? SAMPLE.eventDescription.slice(0, 107) + "…" : SAMPLE.eventDescription
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><style>
    html, body { height: 100%; margin: 0; overflow: hidden; -webkit-text-size-adjust: 100%; }
    * { box-sizing: border-box; }
    .tg {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 100%;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: #8eb7db;
    }
    .tg-head {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: clamp(6px, 2vmin, 10px);
      padding: clamp(6px, 2vmin, 10px) 10px;
      background: linear-gradient(180deg, #5eb5f7 0%, #4a9fe8 100%);
      box-shadow: 0 1px 3px rgba(0,0,0,.15);
      color: #fff;
    }
    .tg-back {
      width: clamp(28px, 8vmin, 36px);
      height: clamp(28px, 8vmin, 36px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(18px, 5vmin, 22px);
      opacity: .95;
    }
    .tg-head-mid { flex: 1; min-width: 0; text-align: center; }
    .tg-chat-title { font-size: clamp(13px, 3.8vmin, 16px); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tg-chat-sub { font-size: clamp(10px, 2.8vmin, 12px); opacity: .9; margin-top: 1px; }
    .tg-search { font-size: clamp(16px, 4.5vmin, 20px); opacity: .9; padding: 4px; }
    .tg-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: clamp(8px, 2.5vmin, 12px);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      background: linear-gradient(180deg, rgba(110,163,207,.5) 0%, #8eb7db 40%);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath fill='%23ffffff' fill-opacity='0.05' d='M0 40h40v40H0z'/%3E%3C/svg%3E");
    }
    .tg-service {
      align-self: center;
      flex-shrink: 0;
      margin-bottom: clamp(6px, 2vmin, 10px);
      padding: 3px 10px;
      border-radius: 12px;
      background: rgba(0,44,87,.22);
      font-size: clamp(9px, 2.6vmin, 11px);
      color: #fff;
      max-width: 96%;
      text-align: center;
      line-height: 1.35;
    }
    .tg-row { display: flex; justify-content: flex-start; align-items: flex-end; gap: 6px; }
    .tg-av {
      width: clamp(30px, 9vmin, 36px);
      height: clamp(30px, 9vmin, 36px);
      border-radius: 50%;
      background: linear-gradient(180deg, #6bc263 0%, #4fa843 100%);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: clamp(11px, 3.2vmin, 14px);
      color: #fff;
    }
    .tg-bubble-wrap { max-width: calc(100% - 44px); }
    .tg-name { font-size: clamp(10px, 2.8vmin, 12px); color: #fff; margin: 0 0 3px 4px; text-shadow: 0 1px 1px rgba(0,0,0,.15); }
    .tg-msg {
      background: #fff;
      border-radius: 12px 12px 12px 4px;
      padding: clamp(8px, 2.2vmin, 11px) clamp(10px, 2.8vmin, 12px);
      box-shadow: 0 1px 2px rgba(0,0,0,.12);
      font-size: clamp(11px, 3.2vmin, 13px);
      line-height: 1.42;
      color: #000;
    }
    .tg-msg strong { font-size: clamp(12px, 3.4vmin, 14px); display: block; margin-bottom: 4px; }
    .tg-sub { margin-top: 6px; font-size: clamp(9px, 2.6vmin, 11px); color: #707579; line-height: 1.35; }
    .tg-time { text-align: right; font-size: clamp(9px, 2.5vmin, 10px); color: #a1aab3; margin-top: 4px; }
    .tg-compose {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: clamp(6px, 2vmin, 9px) 10px 10px;
      background: rgba(255,255,255,.35);
    }
    .tg-compose-inner {
      flex: 1;
      background: rgba(255,255,255,.92);
      border-radius: 20px;
      padding: 8px 14px;
      font-size: clamp(11px, 3vmin, 13px);
      color: #8e9296;
    }
  </style></head><body>
  <div class="tg">
    <div class="tg-head">
      <div class="tg-back">&#8592;</div>
      <div class="tg-head-mid">
        <div class="tg-chat-title">${escapeHtml(SAMPLE.eventTitle)}</div>
        <div class="tg-chat-sub">bot · ${escapeHtml(when.split(" · ")[0])}</div>
      </div>
      <div class="tg-search">&#8981;</div>
    </div>
    <div class="tg-body">
      <div class="tg-service">Messages in this chat are from a verified Sunrise bot.</div>
      <div class="tg-row">
        <div class="tg-av">S</div>
        <div class="tg-bubble-wrap">
          <div class="tg-name">Sunrise Bot</div>
          <div class="tg-msg">
            <strong>${escapeHtml(SAMPLE.eventTitle)}</strong>
            ${escapeHtml(shortDesc)}
            <div class="tg-sub">${escapeHtml(SAMPLE.eventLocation)} · Hi ${escapeHtml(SAMPLE.guestName)}, reply YES to RSVP.</div>
            <div class="tg-time">${escapeHtml(when)}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="tg-compose">
      <span style="font-size:20px">&#128206;</span>
      <div class="tg-compose-inner">Message</div>
      <span style="font-size:20px">&#127908;</span>
    </div>
  </div>
</body></html>`
}
