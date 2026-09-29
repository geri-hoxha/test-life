# Azure LifeFlow

A React web front-end for managing an insurance business: offers, policies, renewals, invoices, customers, agents, partners, commissions and more.

## Features

- Dashboard with KPIs, activity chart, and recent offers/policies
- Offers, policies, renewals and invoices
- Customers, people, companies, agents and partners
- Agent and partner commissions
- Products, coverages, policy plans and rating tables
- Bank accounts, documents (with preview), currency rates and risk list
- User administration, authentication and password management
- Excel export (xlsx)

## Tech Stack

React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), React Router, TanStack Query, Recharts, Zod, Vitest.

## Getting Started

```bash
npm install
npm run dev
```

The API base URL is configured via `VITE_API_BASE_URL` (see `src/api/client.ts`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests once |
