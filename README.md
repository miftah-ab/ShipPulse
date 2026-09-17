<div align="center">

# ShipPulse

### Ship it. Explain it. Keep users in the loop.

**The modern product communication engine.**  
Turn raw code commits into polished release notes, host high-converting changelog portals, and distribute real-time product updates across multiple channels.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![AI Powered](https://img.shields.io/badge/AI-Groq%20%2F%20OpenRouter-purple?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

[Live Demo](https://shippulse.vercel.app) • [Documentation](https://shippulse.vercel.app/docs) • [Report Bug](https://github.com/miftah-ab/ShipPulse/issues) • [Request Feature](https://github.com/miftah-ab/ShipPulse/issues)

</div>

---

## Overview

Engineering teams ship at high velocity, but communication typically lags behind. **ShipPulse** bridges the gap between software delivery and customer delight. By synthesizing GitHub activity, commits, and pull requests with LLM intelligence, ShipPulse auto-generates transparent, customer-facing product updates in seconds.

### Why Teams Choose ShipPulse

- **Zero-Friction Ingestion:** Seamless webhook integrations with GitHub repositories.
- **Context-Aware AI Synthesis:** Translates technical PRs into engaging release notes tailored by audience persona.
- **Rock-Solid Infrastructure:** Role-based access control, audit logs, granular API keys, and Row Level Security (RLS).
- **Omnichannel Distribution:** Hosted public changelog portals, in-app notification widgets, RSS/Atom feeds, and automated email broadcasts.

---

## Key Capabilities

```
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│  GitHub Events  │  ───> │  AI Engine      │  ───> │ Multi-Channel Output   │
│  (PRs, Commits) │       │  (Groq/Llama-3) │       │ (Portal, Widget, Mail) │
└─────────────────┘       └─────────────────┘       └────────────────────────┘
```

### 1. Automated Release Note Generation
- Real-time GitHub webhook sync triggers release drafts automatically.
- Multi-model flexibility powered by **Groq** and **OpenRouter** with fallback protection.
- Guardrails for prompt injection, secret scanning, and sensitive data redaction.

### 2. Modern Public Changelog Portal
- Blazing-fast edge-rendered public pages at `/[projectSlug]`.
- Categorized tagging (`Features`, `Improvements`, `Fixes`, `Security`).
- Searchable updates, rich media support, and user reaction feedback loops.

### 3. Embeddable In-App Notification Widget
- Lightweight embed script (`/widget.js`) with zero dependencies.
- Native "What's New" badge with unread counters and trigger modals.
- Fully customizable CSS variables matching host application design systems.

### 4. Subscriber Growth & Retention
- Built-in email subscription workflows powered by **Resend**.
- Automated email blasts on publish events with unsubscribe compliance.
- Syndication support via RSS and JSON feeds (`/api/public/[projectSlug]/rss`).

### 5. Developer First & Extensible
- Full RESTful API with scoped API keys (`sp_live_...`).
- Outgoing webhooks with cryptographic signature verification (`X-ShipPulse-Signature`).
- Comprehensive rate limiting and entitlement enforcement for multi-tenant tiers.

---

## Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org) with React 19 |
| **Language** | [TypeScript](https://www.typescriptlang.org) with strict type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + custom HSL design tokens |
| **Database & Auth** | [Supabase PostgreSQL](https://supabase.com) with Row Level Security (RLS) |
| **Intelligence** | [Groq SDK](https://groq.com) & [OpenRouter](https://openrouter.ai) |
| **Email Infrastructure** | [Resend](https://resend.com) |
| **Icons & UI** | [Lucide Icons](https://lucide.dev) & Radix-inspired micro-interactions |

---

## Quick Start

### Prerequisites
- **Node.js**: v20.x or higher
- **npm** / **pnpm** / **bun**
- A free **Supabase** project
- (Optional) **Groq** or **OpenRouter** API key for AI generation

### 1. Clone & Install

```bash
git clone https://github.com/miftah-ab/ShipPulse.git
cd ShipPulse
npm install
```

### 2. Environment Setup

Create `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

Configure your credentials:

```ini
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=updates@yourdomain.com
```

### 3. Database Migrations

Apply the included migration scripts in your Supabase SQL Editor:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Security & Reliability

- **Row Level Security (RLS):** Strict isolation ensuring tenants can only access their authorized workspace data.
- **Audit Logging:** Every administrative action, token issuance, and configuration change is persistently logged.
- **Secret Sanitization:** AI prompts scrub potential API keys, connection strings, and internal hashes before LLM transmission.
- **Rate-Limiting:** Token bucket and sliding-window rate limiters protecting public endpoints and webhooks.

---

## Roadmap

- [x] Multi-tenant workspace architecture
- [x] GitHub webhook auto-sync & AI draft generation
- [x] Public changelog portal & subscriber email system
- [x] Embeddable lightweight JS widget
- [ ] Slack & Discord webhook broadcasts
- [ ] Jira & Linear issue linking
- [ ] Multi-language changelog translations

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with precision for software engineering organizations worldwide.</sub>
</div>
