# Multi‑prototype structure & password gate

## Goals

1. **Multiple prototypes** – Site holds several projects and prototypes; current POS is “Project 1: Checkout POS → Prototype 1 (QSR)”.
2. **Landing page** – First screen is a gate (password) before any prototype is visible.
3. **No visual change** to the existing QSR prototype itself.

---

## Route structure (Next.js App Router)

```
/                          → Landing (password gate)
/prototypes                 → Prototype index (after auth)
/prototypes/checkout-pos/qsr     → Project 1, Prototype 1 (current POS) ✅
/prototypes/checkout-pos/fsr     → Project 1, Prototype 2 (FSR) — later
/prototypes/checkout-pos/retail  → Project 1, Prototype 3 — later
/prototypes/checkout-pos/voice   → Project 1, Prototype 4 — later
/prototypes/printer-routing      → Project 2 — later
```

- **Landing (`/`)**  
  - Single purpose: enter password to “unlock” the site.  
  - On success: set auth (e.g. cookie or sessionStorage) and redirect to `/prototypes`.

- **Prototype index (`/prototypes`)**  
  - Lists projects and their prototypes (from a config).  
  - Only reachable if gate is passed (middleware or layout checks auth).  
  - Each prototype is a link to its route (e.g. `/prototypes/checkout-pos/qsr`).

- **Prototype routes**  
  - Each is a page that renders the right prototype (e.g. QSR = current `POSScreen` in iPad mock).  
  - Placeholder pages for FSR, Retail, Voice, Printer routing can show “Coming soon” until we build them.

---

## Auth (password gate)

**Option A – Client-only (simplest)**  
- Password in env: `NEXT_PUBLIC_GATE_PASSWORD` (or a hash).  
- Landing page: input + submit.  
- On match: write a flag to `sessionStorage` (e.g. `gate_passed = true`) and redirect to `/prototypes`.  
- Prototype index and all `/prototypes/*` layouts read that flag; if missing, redirect to `/`.  
- **Pros:** No backend, quick to ship. **Cons:** Not secure (password in client bundle if plain); only deters casual access.

**Option B – Cookie + API route**  
- Next.js API route (e.g. `POST /api/gate`) checks password (server-side, compare to env).  
- On success: set an httpOnly cookie (e.g. `gate_token`) and return 200.  
- Middleware on `/prototypes/*` checks cookie; if missing, redirect to `/`.  
- **Pros:** Password never in client; slightly better. **Cons:** Still not “real” auth; good for internal demos.

**Recommendation:** Start with **Option A** (sessionStorage + env) so we can ship the structure and UX fast; switch to Option B if you want the password off the client.

---

## Data: projects & prototypes

Central config (e.g. `lib/prototypes-config.ts`) drives the index page and routing:

```ts
export const projects = [
  {
    id: "checkout-pos",
    name: "Project 1: Checkout POS",
    prototypes: [
      { id: "qsr", name: "Prototype 1 QSR", path: "/prototypes/checkout-pos/qsr", ready: true },
      { id: "fsr", name: "Prototype 2 FSR", path: "/prototypes/checkout-pos/fsr", ready: false },
      { id: "retail", name: "Prototype 3 Retail", path: "/prototypes/checkout-pos/retail", ready: false },
      { id: "voice", name: "Prototype 4 Voice ordering", path: "/prototypes/checkout-pos/voice", ready: false },
    ],
  },
  {
    id: "printer-routing",
    name: "Project 2: Printer routing",
    prototypes: [
      { id: "main", name: "Printer routing", path: "/prototypes/printer-routing", ready: false },
    ],
  },
];
```

- **Index page** loops over `projects` and their `prototypes`, linking to `path` when `ready: true`, or showing “Coming soon” when `ready: false`.
- **Routing:** Each `path` corresponds to a route segment (e.g. `app/prototypes/checkout-pos/qsr/page.tsx` for the current POS).

---

## File / folder changes (summary)

| Add/change | Purpose |
|------------|--------|
| `app/page.tsx` | Replace current content with landing (password form). |
| `app/prototypes/layout.tsx` | Auth check (sessionStorage or cookie); redirect to `/` if not passed. |
| `app/prototypes/page.tsx` | Prototype index: list projects + prototypes from config. |
| `app/prototypes/checkout-pos/qsr/page.tsx` | Current POS (move existing `page` content here). |
| `app/prototypes/checkout-pos/fsr/page.tsx` | Placeholder “Coming soon” (and same for retail, voice if you want separate routes). |
| `app/prototypes/printer-routing/page.tsx` | Placeholder for Project 2. |
| `lib/prototypes-config.ts` | Projects + prototypes config. |
| (Optional) `middleware.ts` | If you use cookie auth, protect `/prototypes` here. |

No changes to existing POS components (e.g. `POSScreen`, `IPadMock`); they’re just rendered from the new QSR route.

---

## Flow

1. User opens site → **Landing** (`/`).  
2. Enters password → (optional: call API) → set sessionStorage (or cookie) → redirect to **`/prototypes`**.  
3. **Prototype index** shows Project 1 (Checkout POS) with QSR link + FSR/Retail/Voice “Coming soon”, and Project 2 (Printer routing) “Coming soon”.  
4. Click “Prototype 1 QSR” → **`/prototypes/checkout-pos/qsr`** → same POS as today in iPad mock.  
5. Later: add real FSR/Retail/Voice/Printer pages and set `ready: true` in config.

---

## Can we do this?

Yes. This fits the current Next.js app and doesn’t require new infra for the first version. If you want, next step is to implement the landing page, config, and route moves (and optionally middleware for cookie-based gate).
