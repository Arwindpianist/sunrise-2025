Here is a **Product Requirements Document (PRD)** for implementing the **Login, User Dashboard, Email Blasting**, and **Importing Contacts from Email** features of **Sunrise-2025.com**. This PRD is designed to guide the development of the backend, middleware, and any required frontend API consumption.

---

# 🌅 Sunrise-2025.com – PRD: Login, Dashboard, Email Blasting & Contact Import

**Version:** 1.0
**Author:** \[You]
**Date:** June 2025
**Scope:** Full-stack functionality for authentication, user dashboard, email message blasting, and contact import from email accounts (Gmail, Outlook)

---

## 🧭 1. Purpose

The purpose of this module is to:

* Allow users to securely register and log in to the platform.
* Provide users with a dashboard to manage their events, messages, contacts, and subscriptions.
* Enable users to send scheduled or immediate email blasts.
* Allow importing of contact lists from Gmail or Outlook with consent.

---

## 📌 2. Features and Requirements

### ✅ 2.1 User Authentication

**Requirements:**

* Secure registration/login using email and password
* JWT-based session tokens
* Forgot password functionality
* Optional social login via Google (for MVP+)

**API Endpoints:**

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

**Success Criteria:**

* Users can log in and receive JWT
* Protected endpoints only accessible with valid token
* Authenticated state stored in cookies or localStorage

---

### ✅ 2.2 User Dashboard

**Functionality:**

* Overview of:

  * Active events
  * Scheduled messages
  * Remaining tokens
  * Subscription plan
* Quick links to:

  * Create event
  * Send new message
  * Upgrade plan
  * Manage contacts

**API Endpoints:**

```
GET /api/dashboard/summary
```

**Data Returned:**

```json
{
  "eventsCount": 4,
  "messagesScheduled": 6,
  "activePlan": "Pro",
  "tokenBalance": 120
}
```

---

### ✅ 2.3 Email Blasting

**Requirements:**

* Send one-off or scheduled emails to selected contacts
* Deduct tokens per recipient
* Use Resend (or MailerSend) to send emails
* Store sent message logs and statuses
* Include personalized fields (e.g. {{name}})

**API Endpoints:**

```
POST /api/messages/email/send
GET  /api/messages/email/log
```

**Request Example:**

```json
{
  "subject": "You're invited!",
  "body": "Hi {{name}}, join us for our special day on {{event_date}}.",
  "eventId": "abc123",
  "contactIds": ["c1", "c2", "c3"],
  "scheduleAt": "2025-06-10T10:00:00Z"
}
```

**Backend Workflow:**

1. Validate user subscription/tokens
2. Schedule message via Supabase Edge Functions
3. Send via Resend at the scheduled time
4. Log delivery status per contact

---

### ✅ 2.4 Import Contacts from Email (Gmail / Outlook)

**Requirements:**

* Allow user to import contacts from Gmail or Outlook via OAuth
* User consents via OAuth screen
* Import basic contact data: name, email
* Merge with existing contacts and remove duplicates

**Integration Tools:**

* Google People API
* Microsoft Graph API

**OAuth Flow:**

1. User clicks “Import from Gmail/Outlook”
2. Redirect to provider’s OAuth screen
3. On success, fetch contacts using access token
4. Store contacts in user’s contact list

**API Endpoints:**

```
GET  /api/oauth/google/initiate
GET  /api/oauth/google/callback
POST /api/contacts/import
```

**Contact Schema:**

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com"
}
```

---

## 🗂️ 3. Database Schema (Additions)

### Users Table (Already Exists)

### Contacts Table (Expand)

| Field          | Type                               |
| -------------- | ---------------------------------- |
| id             | UUID (PK)                          |
| user\_id       | FK → users                         |
| name           | String                             |
| email          | String                             |
| imported\_from | Enum: `manual`, `gmail`, `outlook` |

### Messages Table (Expand)

| Field         | Type                              |
| ------------- | --------------------------------- |
| id            | UUID (PK)                         |
| user\_id      | FK → users                        |
| subject       | String                            |
| body          | Text                              |
| type          | Enum (`email`, `sms`, `whatsapp`) |
| scheduled\_at | Timestamp                         |
| status        | Enum                              |

---

## ⚙️ 4. Technologies

| Feature                  | Technology                         |
| ------------------------ | ---------------------------------- |
| Authentication           | Supabase Auth or NextAuth.js       |
| Database                 | Supabase PostgreSQL                |
| Email Service            | Resend (free tier available)       |
| OAuth Integration        | Google People API, Microsoft Graph |
| Scheduler                | Supabase Edge Functions (CRON)     |
| Rate Limiting & Security | Middleware (Next.js or Supabase)   |
| Frontend Integration     | Next.js App Router (Already done)  |

---

## 🔌 5. Integration Points (Frontend ↔ API)

| Frontend Component    | API Endpoint                   | Notes                  |
| --------------------- | ------------------------------ | ---------------------- |
| Login/Register Form   | `/api/auth/login`, `/register` | Stores JWT             |
| Dashboard Widget      | `/api/dashboard/summary`       | Refresh on login       |
| Email Composer        | `/api/messages/email/send`     | Validate token balance |
| Message History Log   | `/api/messages/email/log`      | Pagination             |
| Contact Import Button | `/api/oauth/google/initiate`   | OAuth flow             |

---

## 🧪 6. Testing & Validation

* ✅ JWT required for all protected API endpoints
* ✅ Import handles duplicates and rate limits
* ✅ Token deduction verified before sending emails
* ✅ Email scheduling stores timezones correctly
* ✅ Message delivery results are logged correctly

---

## ✅ 7. Definition of Done (DOD)

* [ ] Users can register, login, logout
* [ ] Dashboard displays real user data
* [ ] Email messages can be scheduled and sent
* [ ] Tokens deducted correctly based on usage
* [ ] Users can import Gmail/Outlook contacts
* [ ] Backend responds securely with valid CORS/JWT policies
* [ ] Frontend integrated with all endpoints

---

Would you like this exported as:

* ✅ Markdown or PDF
* ✅ GitHub issue/task format
* ✅ Swagger/OpenAPI spec (for API routes)

Let me know and I’ll provide it right away.
