# Product Requirements Document (PRD)

## Project Name

Sunrise Platform Monorepo Migration

---

# Overview

The goal of this project is to consolidate the existing `sunrise-2025` and `sunset-2025` applications into a single scalable monorepo architecture using:

* Turborepo
* pnpm workspaces
* Shared packages
* Shared business logic
* Shared database layer
* Shared UI system
* Brand/theme abstraction

The resulting architecture must support:

* Multiple branded applications
* Shared backend logic
* Shared UI components
* Shared database schema
* Shared authentication and billing
* Shared APIs
* Independent deployment capability
* Long-term scalability for future brands/products

The migration must preserve all existing functionality while reducing duplicated code and maintenance overhead.

---

# Current State

## sunrise-2025

Primary production application containing:

* Full web app
* PWA support
* Event creation
* Messaging/reminders
* Finance/payment logic
* User management
* Dashboard
* Shared business workflows

## sunset-2025

Secondary application created as a reskin/fork of Sunrise with:

* Different branding
* Somber UI/UX
* Funeral and memorial workflows
* Some custom pages and logic

Most business logic is duplicated between repositories.

---

# Problems

Current architecture causes:

* Duplicate maintenance effort
* Difficult synchronization of features
* Diverging implementations
* Repeated bug fixes
* Shared logic duplicated across repos
* Increased AI context fragmentation in Cursor
* Poor scalability for future brands

---

# Objectives

## Primary Objectives

1. Merge both projects into a single Turborepo monorepo
2. Eliminate duplicated shared logic
3. Create reusable shared packages
4. Create reusable UI system with brand theming
5. Preserve separate branded apps
6. Improve Cursor AI repo-wide reasoning
7. Maintain existing production functionality

---

# Technical Stack

## Required

* Next.js App Router
* TypeScript
* Turborepo
* pnpm workspaces
* TailwindCSS
* Shared package architecture

## Existing Technologies To Preserve

* Existing DB provider
* Existing auth provider
* Existing payment provider
* Existing PWA setup
* Existing deployment flow where possible

---

# Monorepo Structure

```txt
/apps
  /sunrise-web
  /sunset-web

/packages
  /ui
  /core
  /db
  /auth
  /billing
  /notifications
  /email
  /shared-types
  /config
```

---

# Functional Requirements

# 1. Shared UI System

## Requirements

* Create reusable UI component library
* Remove duplicated components
* Support brand theming
* Shared design system

## Components To Extract

* Buttons
* Inputs
* Cards
* Modals
* Layouts
* Tables
* Navigation
* Dashboard widgets
* Forms
* Toasts
* Mobile/PWA shell

## Theme System

Applications must support:

```ts
brand: "sunrise" | "sunset"
```

Each brand can define:

* Colors
* Typography
* Icons
* Tone
* Assets
* Motion intensity
* Background styling

---

# 2. Shared Core Business Logic

## Requirements

Extract reusable logic into `/packages/core`.

Must include:

* Event creation
* Event management
* RSVP
* Notifications
* Scheduling
* Reminders
* User permissions
* Dashboard services
* Shared APIs
* Shared hooks
* Shared utilities

---

# 3. Shared Database Layer

## Requirements

Create centralized DB package.

Must include:

* Prisma schema
* DB client
* Migrations
* Repositories
* Shared types

## Multi-Brand Support

Add brand awareness where required:

```ts
brand
eventType
workspace
tenant
```

---

# 4. Separate App Identity

## Sunrise

Must retain:

* Existing vibrant branding
* Existing event workflows
* Existing landing pages

## Sunset

Must retain:

* Somber branding
* Funeral workflows
* Memorial-specific pages
* Condolence systems

---

# 5. Shared Authentication

## Requirements

Centralize:

* Auth providers
* Session handling
* Middleware
* RBAC
* User management

---

# 6. Shared Billing

## Requirements

Centralize:

* Subscription logic
* Invoicing
* Payment integrations
* Transaction utilities

---

# 7. Shared Notifications

## Requirements

Centralize:

* Email
* SMS
* WhatsApp
* Telegram
* Push notifications

---

# Non-Functional Requirements

# Performance

* No significant regression
* Shared package tree-shaking
* Efficient Turborepo caching

# Scalability

Architecture must support future brands without duplication.

# Maintainability

* Strong typing
* Clear boundaries
* Minimal circular dependencies

# Developer Experience

* Excellent Cursor AI navigation
* Fast local builds
* Shared linting
* Shared TypeScript config

---

# Migration Strategy

# Phase 1 — Initialize Monorepo

* Create Turborepo
* Configure pnpm workspaces
* Move existing apps into `/apps`
* Ensure both apps still run independently

# Phase 2 — Extract Shared Packages

Priority order:

1. shared-types
2. config
3. ui
4. db
5. auth
6. core
7. billing
8. notifications

# Phase 3 — Theme System

* Implement BrandProvider
* Replace hardcoded colors/styles
* Add shared theme tokens

# Phase 4 — Remove Duplication

* Deduplicate APIs
* Deduplicate hooks
* Deduplicate layouts
* Deduplicate services

# Phase 5 — Optimization

* Add Turbo caching
* Add linting
* Add CI/CD optimization

---

# Success Criteria

Project is successful when:

* Both apps run from one monorepo
* Shared logic exists only once
* Shared UI is reusable
* Branding is theme-driven
* Deployments remain stable
* Cursor can reason repo-wide efficiently
* Future brands can be added easily

---

# Risks

## Main Risks

* Over-aggressive refactoring
* Breaking production routes
* Shared package circular dependencies
* Theme abstraction complexity

## Mitigation

* Incremental extraction
* Preserve working apps first
* Refactor gradually
* Keep APIs backward-compatible

---

# Future Expansion

Architecture should later support:

* White-label SaaS
* Multi-tenancy
* Mobile apps
* Shared admin platform
* Enterprise variants
* API platform
* Public SDKs

---
