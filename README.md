# FeedbackKit 🗳️

> Feature request boards + roadmap voting for indie SaaS — Canny, but $9/mo.

[![ThreeStack](https://img.shields.io/badge/ThreeStack-product-blue)](https://threestack.io)
[![Status](https://img.shields.io/badge/status-pre--launch-orange)](https://feedbackkit.threestack.io)

## Overview

FeedbackKit gives every SaaS product a clean, public feedback board where users can submit feature requests, vote on existing requests, and get notified when their requests ship.

**Domain:** feedbackkit.threestack.io

## Stack

- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript (strict)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** NextAuth.js v5 (GitHub + Google OAuth)
- **Email:** Resend
- **Payments:** Stripe
- **Styling:** TailwindCSS + Radix UI
- **Deploy:** Vercel

## Monorepo Structure

```
feedbackkit/
├── apps/
│   └── web/          # Next.js 14 frontend + API routes
└── packages/
    └── db/           # Drizzle ORM schema + migrations
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
pnpm db:push

# Start development
pnpm dev
```

## Pricing

| Plan | Price | Boards | Requests |
|------|-------|--------|----------|
| Free | $0 | 1 | 50 |
| Indie | $9/mo | 3 | Unlimited |
| Pro | $19/mo | 10 | Unlimited |
| Team | $49/mo | Unlimited | Unlimited |

## License

MIT — Built by [ThreeStack](https://threestack.io)
