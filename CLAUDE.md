# CLAUDE.md — Axiom Altis Connect

## Project overview

Axiom Altis Connect is a French-language B2B/B2C talent-matching platform that connects African professionals (primarily from Cameroon/MINEFOP) with French employers in high-tension occupations. It is a Lovable-generated SPA built with Vite + React + TypeScript, backed by Supabase.

The platform has four user roles: `talent`, `entreprise`, `recruteur`, and `admin`, each with dedicated dashboards and access controls. UI copy is almost entirely in French.

---

## Tech stack

| Layer | Technology |
|---|---|
| Build tool | Vite 5 (`@vitejs/plugin-react-swc`) |
| Framework | React 18, TypeScript 5 |
| Routing | React Router DOM v6 |
| State / data fetching | TanStack Query v5 |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v3 with CSS variables for theming |
| Animation | Framer Motion |
| Backend / database | Supabase (Postgres + Auth + Edge Functions + Storage) |
| PDF generation | jsPDF + html2canvas |
| Forms | react-hook-form + zod |
| Analytics | Google Analytics 4 (`G-4KKLB8SDHZ`) |
| Testing | Vitest + jsdom + @testing-library/react |
| Package manager | npm (also has a bun.lock but npm is primary) |

---

## Repository layout

```
src/
  App.tsx                   # Root component: providers + all routes
  main.tsx                  # Entry point
  index.css                 # Global CSS, Tailwind layers, CSS variable tokens
  contexts/
    AuthContext.tsx          # Auth state (session, user, role)
  integrations/
    supabase/
      client.ts             # Supabase client (auto-generated — do not edit)
      types.ts              # Full DB schema types (auto-generated — do not edit)
    lovable/
      index.ts              # Lovable cloud-auth integration
  components/
    ui/                     # shadcn/ui base components (do not modify manually)
    dashboard/              # Dashboard-specific compound components
    landing/                # Marketing page sections
    messaging/              # Conversation drawer + button
    about/                  # Contact form
    pricing/                # FAQ accordion
    signup/                 # CV upload + premium badge
    AppHeader.tsx           # Top navigation bar
    AppSidebar.tsx          # Role-aware sidebar
    DashboardLayout.tsx     # Common wrapper: SidebarProvider + AppHeader + main
    ProtectedRoute.tsx      # Auth + role guard
    ErrorBoundary.tsx       # Top-level React error boundary
    GA4RouteTracker.tsx     # SPA page-view tracker
    CookieConsentBanner.tsx # GDPR consent banner
    ...
  pages/
    Index.tsx               # Landing page (/)
    Login.tsx / Signup.tsx / SignupLight.tsx / SignupTalent.tsx
    OnboardingRole.tsx      # Post-auth role selection
    Dashboard.tsx           # Generic dashboard (role-router)
    DashboardEntreprise.tsx / DashboardTalent.tsx / DashboardRecruteur.tsx / DashboardSociete.tsx
    Admin*.tsx              # Admin-only pages (/admin/*)
    FicheMetier*.tsx        # Static SEO pages for ROME job codes
    MetiersEnTension.tsx / FichesMetiersIndex.tsx / MetierDetail.tsx
    Pricing.tsx / DemandeDevis.tsx / APropos.tsx / Pitch.tsx
    ...
  lib/
    utils.ts                # cn() — clsx + tailwind-merge
    ga4.ts                  # GA4 event tracking wrapper
    trackFunnel.ts          # Supabase funnel_events logger
    passwordSecurity.ts     # Strength check + HIBP k-anonymity check
    rateLimiter.ts          # Client-side rate limiter (Map-based, per action)
    generateQuotePdf.ts     # jsPDF quote generator
    metierAvatars.ts        # ROME code → asset image mapping
  data/
    dashboardMockData.ts    # Mock data used in dev/demo views
  hooks/
    use-toast.ts            # Toast hook (re-exported from ui/use-toast)
    use-mobile.tsx          # Responsive breakpoint hook
  assets/                   # Static images (job sectors, avatars, partner logos)
  test/
    setup.ts                # @testing-library/jest-dom matchers
    example.test.ts         # Placeholder test

supabase/
  config.toml               # Project ID + Edge Function JWT config

public/                     # favicon, OG image, sitemap.xml, robots.txt
```

---

## Authentication & authorisation

- Auth is handled by Supabase Auth (email/password and magic link supported; Google OAuth available).
- After sign-in, the user's role is fetched from the `user_roles` table via `fetchRole()` in `AuthContext.tsx`.
- The `useAuth()` hook exposes `{ session, user, role, loading, signOut }`.
- `<ProtectedRoute>` accepts `allowedRoles` and redirects unauthorised users to their own dashboard. Unauthenticated users go to `/login`. Users without a role go to `/onboarding-role`.
- The four roles are defined as a Postgres enum: `app_role = "entreprise" | "talent" | "admin" | "recruteur"`.

---

## Routing conventions

All routes are declared in `src/App.tsx`. The pattern is:

- **Public pages** — plain `<Route>` elements, no guard.
- **Role-protected pages** — wrapped with `<ProtectedRoute allowedRoles={[...]}>`.
- **Lazy loading** — only `Index`, `Login`, and `NotFound` are eagerly imported. Everything else uses `React.lazy()` + `<Suspense fallback={<FullPageLoader />}>`.

ROME-coded job detail pages follow the pattern `/fiches-metiers/<rome-code>-<slug>` (e.g., `/fiches-metiers/f1703-macon`). A catch-all `/fiches-metiers/:rome` also exists for dynamic lookup.

---

## Supabase database tables

| Table | Purpose |
|---|---|
| `profiles` | Basic user profile (name, email, avatar, skills, country) |
| `user_roles` | Maps `user_id` → `app_role` |
| `talent_profiles` | Extended talent data (ROME code, score, compliance, visa status, premium) |
| `company_profiles` | Enterprise data (SIRET, subscription status) |
| `job_offers` | Job postings created by enterprises |
| `candidatures` | Talent applications / dossiers |
| `metiers_minefop_rome` | Reference table — ROME ↔ MINEFOP occupations with tension level |
| `leads` | Pre-signup leads (email/phone, ROME code, UTM params) |
| `generated_quotes` | PDF devis created by recruiters |
| `quote_requests` | Devis request form submissions |
| `conversations` + `messages` | In-app messaging |
| `notifications` | Per-user notification feed |
| `audit_logs` | Action audit trail (admin) |
| `email_send_log` | Transactional email send log |
| `funnel_events` | Analytics funnel tracking events |
| `csv_import_history` | Admin talent CSV import records |
| `diplomas` | Uploaded diploma files with verification state |
| `talent_shortlist` | Recruiter shortlists |
| `talent_notification_log` | Notification deduplication log |

Key RPC functions: `match_talents_for_offer`, `ensure_conversation`, `has_role`, `get_user_role`, `is_enterprise_subscribed`.

---

## Supabase Edge Functions

Edge functions are in Supabase cloud (not in this repo). Registered in `supabase/config.toml`:

| Function | Purpose |
|---|---|
| `france-travail-offers` | France Travail job offer API proxy |
| `france-travail-formations` / `agences` / `events` | FT API proxies |
| `rome-metier` / `competences-rome` / `marche-du-travail` | ROME API proxies |
| `verify-diploma` | AI-based diploma verification |
| `chat-ai-assist` | AI chat assistant |
| `send-welcome-entreprise` | Welcome email trigger |
| `send-notification` | Push notification sender |
| `send-quote-pdf` | Quote PDF email delivery |
| `send-transactional-email` | Transactional emails (JWT-protected) |
| `create-payment` / `create-payment-lead` / `create-payment-talent` | Stripe payment sessions |
| `create-checkout-entreprise` | Stripe checkout for enterprise subscriptions |
| `customer-portal` | Stripe customer portal |
| `stripe-webhook` | Stripe webhook handler |
| `check-subscription` | Subscription status check |
| `la-bonne-boite` | La Bonne Boîte company search |
| `auth-email-hook` | Custom Supabase auth email hook |
| `handle-email-unsubscribe` / `handle-email-suppression` | Email opt-out handlers |
| `preview-transactional-email` | Email template preview |

---

## Environment variables

Required at build/runtime (set in `.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The `.env` file is gitignored. When working in this environment the values are already present.

---

## Development commands

```bash
npm run dev          # Start Vite dev server on http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development build (keeps source maps)
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run preview      # Preview production build
```

---

## Styling conventions

- Use `cn()` from `@/lib/utils` for conditional class names (`clsx` + `tailwind-merge`).
- All colour tokens are CSS variables defined in `src/index.css`. Never hardcode hex/rgb colours — reference semantic tokens like `text-foreground`, `bg-primary`, `border-card`.
- Dark mode is class-based (`darkMode: ["class"]` in `tailwind.config.ts`). The `<ThemeToggle>` component switches the class on `<html>`.
- Custom semantic tokens defined in Tailwind: `success`, `tension`, `sidebar.*`, `shadow-premium`, `shadow-card`.
- Animation classes: `animate-fade-in`, `animate-scale-in`, `animate-pulse-soft`.
- Fonts: Inter (sans/display), Lora (serif), Space Mono (mono).

---

## Component conventions

- shadcn/ui components live in `src/components/ui/` and should not be modified directly — prefer wrapping or extending.
- Shared layout for authenticated pages: `<DashboardLayout sidebarVariant="entreprise|talent|admin">`.
- Role-aware navigation is in `<AppSidebar>`.
- Use `<OptimizedImage>` for images (wraps `vite-imagetools` transformations).
- Toast notifications: `import { toast } from "sonner"` (not the Radix toast).
- For data fetching, use TanStack Query (`useQuery` / `useMutation`) with the Supabase client.
- The `@` path alias maps to `src/`.

---

## Analytics & tracking

- GA4 measurement ID: `G-4KKLB8SDHZ` — fires only after cookie consent (`axiom_cookie_consent === "accepted"` in localStorage).
- `trackGA4(event, params?)` from `@/lib/ga4` — use predefined `GA4Event` union type for event names.
- `trackFunnel(event, data?)` from `@/lib/trackFunnel` — writes to the `funnel_events` Supabase table.
- `<GA4RouteTracker>` fires `page_view` on route changes automatically.

---

## Security utilities

- `checkRateLimit(action)` in `@/lib/rateLimiter` — client-side in-memory limiter. Actions: `signup` (3/min), `login` (5/min), `payment` (3/min), `contact` (3/min).
- `checkPasswordStrength(pw)` / `checkHIBP(pw)` in `@/lib/passwordSecurity` — strength scoring + Have I Been Pwned k-anonymity check. Fail-open on HIBP API errors.
- GDPR: `<CesedaLegalNotice>` and `/rgpd` + `/rgpd-light` pages. Cookie consent stored in `axiom_cookie_consent` localStorage key.

---

## Testing

- Tests live in `src/**/*.{test,spec}.{ts,tsx}`.
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`).
- Environment: jsdom. Globals enabled.
- Run: `npm run test`.

There is currently minimal test coverage — only a placeholder `example.test.ts`.

---

## Key conventions to follow

1. **Language**: All UI text, variable names in business logic, and page routes are in French (e.g., `candidatures`, `entreprise`, `talent`, `offres`, `devis`).
2. **Auto-generated files**: Never manually edit `src/integrations/supabase/client.ts` or `src/integrations/supabase/types.ts` — these are regenerated by Supabase/Lovable tooling.
3. **Route guards**: Always wrap private pages in `<ProtectedRoute>` with explicit `allowedRoles`. Admin-only pages require `allowedRoles={["admin"]}`.
4. **Lazy loading**: Keep dashboards and admin pages lazy-loaded. Only landing, login, and 404 are eager.
5. **Supabase queries**: Use typed client — `supabase.from("table_name")` benefits from the `Database` type in `types.ts`. Do not bypass types with `as any`.
6. **Theming**: Never hardcode colours. Always use Tailwind semantic tokens.
7. **Form validation**: Use zod schemas with react-hook-form. Validate at submit boundaries.
8. **No console logs in production**: Remove debug logs before committing.
