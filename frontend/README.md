# Mey Veda Grantha — Consolidated Frontend Architecture

Production-ready, consolidated frontend for the **Mey Veda Grantha** integrated Ayurveda healthcare platform.

This consolidated application unifies the previously separate micro-applications (`admin_P1`, `doctor_landing_P1`, `doctor_P1`, and `manufacturer_P1`) into a single, high-performance Vite + React + TypeScript application with a unified TanStack Router, cohesive Tailwind CSS v4 design system, and explicit role/module boundaries.

---

## 1. Architecture & Boundaries

The unified frontend maintains clean layout and access boundaries:

```text
frontend/
├── public/                      # Static assets, branding graphics, robots.txt, manifest.json
│   ├── brand/                   # Mey Veda marks and icons
│   ├── images/                  # Public clinic, doctor, and journey photography
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── app/                     # Core application orchestration
│   │   ├── App.tsx              # Root component wrapping RouterProvider within Providers
│   │   ├── App.jsx              # JSX entry point wrapper
│   │   ├── router.tsx           # Declarative TanStack Router tree with all 40+ routes
│   │   └── providers.tsx        # QueryClient, Store, Theme, and Toaster providers
│   │
│   ├── assets/                  # Bundled media (videos, hero illustrations, photographs)
│   │
│   ├── components/              # Shared reusable UI elements
│   │   ├── ui/                  # Shadcn / Radix UI primitives (Button, Dialog, Card, Input, etc.)
│   │   ├── layout/              # Distinct shells (DoctorWorkspaceLayout, AdminLayout, ManufacturerLayout, PublicLayout)
│   │   ├── forms/               # Standardized form controls
│   │   └── feedback/            # Toast notifications, Loaders, EmptyState, ErrorState
│   │
│   ├── features/                # Domain-scoped business modules
│   │   ├── auth/                # Sign In (Doctor/Admin/Mfg selector), Registration, Password recovery
│   │   ├── landing/             # Public Doctor marketing landing page, Journey stages, Registration modal
│   │   ├── doctor/              # Doctor workspace: Consultations, Medicines, Library, Cases, ADR, Reports
│   │   ├── admin/               # Administration: Governance, Quality, Approvals, Catalog, Doctor oversight
│   │   └── manufacturer/        # Manufacturer: AYUSH Form 25D management, Products, Batches, ADR feedback
│   │
│   ├── services/                # Unified HTTP apiClient and API_ENDPOINTS catalog
│   ├── hooks/                   # Custom reusable React hooks (useMobile, useToast)
│   ├── context/                 # Context definitions (ManufacturerContext, AdminState)
│   ├── store/                   # Reactive state stores (Doctor Store, Admin Store)
│   ├── utils/                   # Shared utility helpers (cn, formatters, date/currency)
│   ├── constants/               # Global navigation links, glossary, badges
│   ├── config/                  # App environment and portal metadata
│   ├── styles/                  # Tailwind v4 globals.css and variables.css
│   │
│   ├── main.jsx                 # Browser DOM entry point
│   └── main.tsx                 # TypeScript entry point
│
├── tests/                       # Unit and route integration test suites
├── .env.example                 # Environment configuration template
├── .env.development             # Local development environment configuration
├── .gitignore                   # Version control exclusions
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML template
├── package.json                 # Consolidated dependencies and scripts
├── tsconfig.json                # TypeScript compiler settings and path aliases
├── vite.config.ts               # Bundler configuration with Tailwind v4 & Vitest
└── README.md
```

---

## 2. Route Map

| URL Route | Module | Description | Access Boundary |
|---|---|---|---|
| `/` | Landing | Public Doctor Landing Page with video, journey stages, and register modal | Public |
| `/doctor` | Landing | Doctor marketing and feature overview | Public |
| `/login` | Auth | Unified login with Doctor, Admin, and Manufacturer role tabs | Public / Auth |
| `/register` | Auth | Multi-step practitioner onboarding and council verification submission | Public / Auth |
| `/forgot-password` | Auth | Password recovery link request | Public / Auth |
| `/reset-password` | Auth | Secure password reset token form | Public / Auth |
| `/workspace` | Doctor | Doctor Workspace home / Active consultation desk | Doctor Shell |
| `/medicines` | Doctor | Medicine catalog, monographs, and pharmacology properties | Doctor Shell |
| `/library` | Doctor | Classical Ayurvedic literature and treatise browser | Doctor Shell |
| `/manufacturers`| Doctor | Verified GMP Ayurvedic medicine manufacturers directory | Doctor Shell |
| `/quality` | Doctor | Medicine batch test certificates and quality reports | Doctor Shell |
| `/cases` | Doctor | Clinical case studies and treatment progression | Doctor Shell |
| `/research` | Doctor | Personal formulation research workspace | Doctor Shell |
| `/adr` | Doctor | Pharmacovigilance and Adverse Drug Reaction (ADR) reporting | Doctor Shell |
| `/reports` | Doctor | Clinical consultation records and outcome analytics | Doctor Shell |
| `/saved` | Doctor | Bookmarked medicines, formulations, and literature | Doctor Shell |
| `/profile` | Doctor | Doctor practice details, council registration & bio | Doctor Shell |
| `/help` | Doctor | Clinical help desk and support tickets | Doctor Shell |
| `/compare` | Doctor | Side-by-side formulation comparator | Doctor Shell |
| `/notifications`| Doctor | Clinical alerts and adverse reaction updates | Doctor Shell |
| `/community` | Doctor | Peer practitioner clinical discussion feed | Doctor Shell |
| `/journals` | Doctor | Peer-reviewed clinical trial journals | Doctor Shell |
| `/referrals` | Doctor | Cross-specialty doctor referral network | Doctor Shell |
| `/admin/*` | Admin | 20+ Administrative governance, catalog & review views | Admin Shell |
| `/manufacturer/*`| Manufacturer| 7 Manufacturer views (Overview, Products, Feedback, ADR) | Manufacturer Shell |

---

## 3. Scripts & Verification

Run all commands from within the `frontend/` directory (or from the root workspace using `npm --prefix frontend <script>`):

```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Run TypeScript type check
npm run typecheck

# Run linter
npm run lint

# Run automated test suites
npm run test

# Run tests in watch mode
npm run test:watch

# Compile optimized production bundle
npm run build

# Preview production build locally
npm run preview
```
