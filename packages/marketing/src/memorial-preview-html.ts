import { format } from "date-fns"

export const MEMORIAL_SAMPLE = {
  honoreeName: "Eleanor Hart",
  eventTitle: "Celebration of life - Eleanor Hart",
  eventDescription:
    "With sympathy we share arrangements for those who wish to attend. Dress is respectful; photography only where indicated.",
  eventDate: new Date(new Date().setDate(new Date().getDate() + 18)),
  eventLocation: "St. Andrew's Chapel · reception following",
  hostName: "The Hart family",
  guestName: "Alex",
}

function eventDateFormatted(d: Date) {
  return format(d, "EEEE, MMMM do yyyy, h:mm a")
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Sunset mail-client chrome for memorial email previews (Dracula-aligned). */
export function wrapSunsetEmailPreview(innerHtml: string, subject: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><style>
    html, body { height: 100%; margin: 0; overflow: hidden; -webkit-text-size-adjust: 100%; }
    .g-root { display: flex; flex-direction: column; height: 100%; max-height: 100%; background: #282a36; color: #f8f8f2; }
    .g-top { flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #21222c; border-bottom: 1px solid #44475a; font-size: 11px; color: #6272a4; }
    .g-subject { flex-shrink: 0; padding: 8px 12px; background: #21222c; font-size: 12px; font-weight: 600; color: #f8f8f2; border-bottom: 1px solid #44475a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .g-meta { flex-shrink: 0; padding: 6px 12px; font-size: 10px; color: #6272a4; background: #21222c; border-bottom: 1px solid #44475a; }
    .fit-area {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 6px 8px 8px;
      display: flex;
      justify-content: center;
      align-items: stretch;
      background: linear-gradient(180deg, #282a36 0%, #21222c 100%);
    }
    .email-preview {
      flex: 1;
      min-height: 0;
      width: 100%;
      max-width: 100%;
      overflow: hidden !important;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
      background: #343746;
      border: 1px solid #44475a;
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
      line-height: 1.25 !important;
      margin: 0 0 clamp(6px, 1.5vmin, 10px) !important;
      font-weight: 700 !important;
      color: #f8f8f2 !important;
    }
    .email-preview > div p {
      font-size: clamp(10px, 3vmin, 12px) !important;
      line-height: 1.45 !important;
      margin: clamp(4px, 1vmin, 8px) 0 !important;
      color: #e2e2e8 !important;
    }
    .email-preview > div p strong { color: #bd93f9; font-weight: 600; }
    .email-preview > div .sig { margin-top: 12px; font-size: 11px; color: #6272a4 !important; }
  </style></head><body>
  <div class="g-root">
    <div class="g-top">
      <span aria-hidden="true">&#9776;</span>
      <span>Inbox</span>
      <span style="opacity:.5">/</span>
      <span style="color:#bd93f9;font-weight:500">Sunset</span>
    </div>
    <div class="g-subject">${escapeHtml(subject)}</div>
    <div class="g-meta">From &lt;care@sunset-2025.com&gt; · to ${escapeHtml(MEMORIAL_SAMPLE.guestName)}</div>
    <div class="fit-area">
      <div class="email-preview">${innerHtml}</div>
    </div>
  </div>
</body></html>`
}

export type MemorialEmailVariant = "service" | "condolence" | "gathering"

function innerEmailService(): string {
  const when = eventDateFormatted(MEMORIAL_SAMPLE.eventDate)
  return `<div style="font-family:Georgia,'Times New Roman',serif;">
    <h1>${escapeHtml(MEMORIAL_SAMPLE.eventTitle)}</h1>
    <p>We invite you to join us in remembering ${escapeHtml(MEMORIAL_SAMPLE.honoreeName)}.</p>
    <p><strong>When:</strong> ${escapeHtml(when)}</p>
    <p><strong>Where:</strong> ${escapeHtml(MEMORIAL_SAMPLE.eventLocation)}</p>
    <p>${escapeHtml(MEMORIAL_SAMPLE.eventDescription)}</p>
    <p class="sig">With gratitude,<br/>${escapeHtml(MEMORIAL_SAMPLE.hostName)}</p>
  </div>`
}

function innerEmailCondolence(): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;">
    <h1>With sympathy - ${escapeHtml(MEMORIAL_SAMPLE.honoreeName)}</h1>
    <p>We are deeply sorry for your loss. Please know we are holding you in our thoughts during this difficult time.</p>
    <p>If it would bring comfort, we have gathered a short remembrance page where messages may be left for the family.</p>
    <p class="sig">Respectfully,<br/>${escapeHtml(MEMORIAL_SAMPLE.hostName)}</p>
  </div>`
}

function innerEmailGathering(): string {
  const when = eventDateFormatted(MEMORIAL_SAMPLE.eventDate)
  return `<div style="font-family:Georgia,'Times New Roman',serif;">
    <h1>Private family gathering</h1>
    <p>This message is for invited guests only. We will gather privately to honour ${escapeHtml(MEMORIAL_SAMPLE.honoreeName)}.</p>
    <p><strong>When:</strong> ${escapeHtml(when)}</p>
    <p><strong>Where:</strong> ${escapeHtml(MEMORIAL_SAMPLE.eventLocation)}</p>
    <p>Please reply only if you have received this note directly from the family.</p>
  </div>`
}

export function buildMemorialEmailChannelPreviewHtml(variant: MemorialEmailVariant = "service"): string {
  const inner =
    variant === "condolence" ? innerEmailCondolence() : variant === "gathering" ? innerEmailGathering() : innerEmailService()
  const subject =
    variant === "condolence"
      ? `With sympathy - ${MEMORIAL_SAMPLE.honoreeName}`
      : variant === "gathering"
        ? `Private gathering - ${MEMORIAL_SAMPLE.honoreeName}`
        : `Arrangements: ${MEMORIAL_SAMPLE.honoreeName}`
  return wrapSunsetEmailPreview(inner, subject)
}

export function buildMemorialWhatsappChannelPreviewHtml(): string {
  const when = format(MEMORIAL_SAMPLE.eventDate, "EEE d MMM · h:mm a")
  const shortDesc =
    MEMORIAL_SAMPLE.eventDescription.length > 118
      ? MEMORIAL_SAMPLE.eventDescription.slice(0, 115) + "…"
      : MEMORIAL_SAMPLE.eventDescription
  const title = `Memorial · ${MEMORIAL_SAMPLE.honoreeName}`
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
      background: linear-gradient(145deg, #6272a4, #44475a);
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
      background-image: repeating-linear-gradient(135deg, rgba(255,255,255,.014) 0 1px, transparent 1px 14px);
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
      background: linear-gradient(180deg, #3d4a5c 0%, #2f3647 100%);
      color: #e9edef;
      border-radius: 10px 10px 2px 10px;
      padding: clamp(8px, 2.2vmin, 11px) clamp(10px, 2.8vmin, 12px);
      box-shadow: 0 1px 0.5px rgba(0,0,0,.28);
      font-size: clamp(11px, 3.2vmin, 13px);
      line-height: 1.42;
    }
    .wa-bubble strong { display: block; font-size: clamp(12px, 3.4vmin, 14px); margin-bottom: 4px; font-weight: 600; }
    .wa-meta { margin-top: 6px; font-size: clamp(9px, 2.6vmin, 11px); opacity: .88; color: #bcc6d4; }
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
        <div class="wa-title">${escapeHtml(title)}</div>
        <div class="wa-sub">care · verified sender</div>
      </div>
      <div class="wa-actions"><span>&#128222;</span><span>&#8942;</span></div>
    </div>
    <div class="wa-chat">
      <div class="wa-date-pill">Today</div>
      <div class="wa-row">
        <div class="wa-bubble">
          <strong>${escapeHtml(MEMORIAL_SAMPLE.eventTitle)}</strong>
          Hi ${escapeHtml(MEMORIAL_SAMPLE.guestName)}, ${escapeHtml(shortDesc)}
          <div class="wa-meta">${escapeHtml(when)} · ${escapeHtml(MEMORIAL_SAMPLE.eventLocation)}</div>
        </div>
      </div>
    </div>
    <div class="wa-foot">
      <span style="font-size:18px">&#128524;</span>
      <div class="wa-input-fake">Message</div>
      <span style="font-size:18px;color:#8696a0">&#128266;</span>
    </div>
  </div>
</body></html>`
}

export function buildMemorialTelegramChannelPreviewHtml(): string {
  const when = format(MEMORIAL_SAMPLE.eventDate, "MMM d · HH:mm")
  const shortDesc =
    MEMORIAL_SAMPLE.eventDescription.length > 105 ? MEMORIAL_SAMPLE.eventDescription.slice(0, 102) + "…" : MEMORIAL_SAMPLE.eventDescription
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/><style>
    html, body { height: 100%; margin: 0; overflow: hidden; -webkit-text-size-adjust: 100%; }
    * { box-sizing: border-box; }
    .tg {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 100%;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: #6b7c93;
    }
    .tg-head {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: clamp(6px, 2vmin, 10px);
      padding: clamp(6px, 2vmin, 10px) 10px;
      background: linear-gradient(180deg, #5c6b89 0%, #4a566d 100%);
      box-shadow: 0 1px 3px rgba(0,0,0,.18);
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
      background: linear-gradient(180deg, rgba(90,102,124,.45) 0%, #7d8ca3 45%);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath fill='%23ffffff' fill-opacity='0.05' d='M0 40h40v40H0z'/%3E%3C/svg%3E");
    }
    .tg-service {
      align-self: center;
      flex-shrink: 0;
      margin-bottom: clamp(6px, 2vmin, 10px);
      padding: 3px 10px;
      border-radius: 12px;
      background: rgba(40,42,54,.35);
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
      background: linear-gradient(180deg, #6272a4 0%, #44475a 100%);
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
      background: #f8f8f2;
      border-radius: 12px 12px 12px 4px;
      padding: clamp(8px, 2.2vmin, 11px) clamp(10px, 2.8vmin, 12px);
      box-shadow: 0 1px 2px rgba(0,0,0,.14);
      font-size: clamp(11px, 3.2vmin, 13px);
      line-height: 1.42;
      color: #282a36;
    }
    .tg-msg strong { font-size: clamp(12px, 3.4vmin, 14px); display: block; margin-bottom: 4px; color: #44475a; }
    .tg-sub { margin-top: 6px; font-size: clamp(9px, 2.6vmin, 11px); color: #6272a4; line-height: 1.35; }
    .tg-time { text-align: right; font-size: clamp(9px, 2.5vmin, 10px); color: #a1aab3; margin-top: 4px; }
    .tg-compose {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: clamp(6px, 2vmin, 9px) 10px 10px;
      background: rgba(255,255,255,.28);
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
        <div class="tg-chat-title">${escapeHtml(MEMORIAL_SAMPLE.eventTitle)}</div>
        <div class="tg-chat-sub">Sunset · ${escapeHtml(when.split(" · ")[0])}</div>
      </div>
      <div class="tg-search">&#8981;</div>
    </div>
    <div class="tg-body">
      <div class="tg-service">Messages in this chat are sent through Sunset memorial outreach.</div>
      <div class="tg-row">
        <div class="tg-av">S</div>
        <div class="tg-bubble-wrap">
          <div class="tg-name">Sunset</div>
          <div class="tg-msg">
            <strong>${escapeHtml(MEMORIAL_SAMPLE.eventTitle)}</strong>
            ${escapeHtml(shortDesc)}
            <div class="tg-sub">${escapeHtml(MEMORIAL_SAMPLE.eventLocation)} · ${escapeHtml(MEMORIAL_SAMPLE.guestName)}, reply when you can.</div>
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
