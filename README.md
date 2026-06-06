# 🌍 Seismic Dashboard — Rayfin + INGV

A **near-realtime earthquake dashboard for Italy**, built as a demo for [Rayfin](https://aka.ms/rayfin) — Microsoft's new AI-first Backend-as-a-Service running on Microsoft Fabric.

> **Purpose:** Explore Rayfin's capabilities by building a real data pipeline:  
> INGV FDSN API (seismic data) → Rayfin entity (SQL on Fabric) → React dashboard

> ✅ **Status:** Deployed and tested on Microsoft Fabric.  
> **Live app:** [fond-poppy-fcf5574772-westeurope.webapp.fabricapps.net](https://fond-poppy-fcf5574772-westeurope.webapp.fabricapps.net)  
> **Workspace:** `ws_fabric_deploy`

![Dashboard screenshot placeholder](docs/screenshot.png)

---

## What this demo shows

| Rayfin capability | How it's used |
|---|---|
| **`@entity()` data model** | `Earthquake` entity with typed fields (`@int`, `@decimal`, `@text`) |
| **Row-level auth** | `@role('authenticated', '*')` — only signed-in users can read/write |
| **Rayfin client (GraphQL)** | `select().orderBy().first().executePaginated()` |
| **Type-safe mutations** | `client.data.Earthquake.create(...)` |
| **Fabric SSO** | `ensureSignedInWithFabric` + embedded mode for iframe context |
| **Local dev (password auth)** | `client.auth.signIn({ email, password })` for Docker dev loop |
| **Static hosting** | React/Vite app deployed alongside the backend via `rayfin up` |
| **OneLake integration** | App data immediately available for Power BI / Notebooks |

---

## Architecture

```
Browser (React + Vite)
  │
  ├── useEarthquakeSync  ──►  INGV FDSN API  (every 5 min, last 24 h)
  │        │
  │        └──►  client.data.Earthquake.create()
  │                     │
  │                     ▼
  │             Rayfin (Microsoft Fabric)
  │               ├── SQL Database in Fabric   ← Earthquake table
  │               ├── GraphQL API              ← /api/graphql
  │               ├── Entra ID SSO             ← /auth
  │               └── Static hosting           ← React bundle
  │
  └── useEarthquakes  ──►  client.data.Earthquake.select(...).execute()
           │
           └──►  Dashboard components
                   ├── StatsBar       (total, max mag, avg depth, last-hour count)
                   ├── EarthquakeMap  (Leaflet — dark tiles, circles by magnitude)
                   ├── MagnitudeHistogram  (Recharts BarChart)
                   ├── DepthScatter       (Recharts ScatterChart)
                   └── EarthquakeTable    (sortable, filterable)
```

### Data source

**INGV FDSN Event API** — `https://webservices.ingv.it/fdsnws/event/1/query`

| Parameter | Value |
|---|---|
| `format` | `geojson` |
| `limit` | `300` |
| `minmag` | `0` |
| `starttime` | last 24 h |
| `orderby` | `time-asc` |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| Docker Desktop | latest (for local dev) |
| Microsoft Fabric | F2+ capacity |
| Fabric Apps (preview) | Enabled by tenant admin |
| GitHub CLI (`gh`) | any (authenticated) |

---

## Quick start

### Option A — Local development (no Fabric required)

```bash
# 1. Clone
git clone https://github.com/alessioandriuloagic/rayfin-seismic-dashboard
cd rayfin-seismic-dashboard

# 2. Install dependencies
npm install

# 3. Start the full stack (Docker backend + Vite dev server)
npm run dev:local
```

Open [http://localhost:5173](http://localhost:5173).  
Use the **email/password** sign-in form — register a user on first run.

> **Note:** Local dev requires Docker Desktop running and the GitHub CLI authenticated  
> with `read:packages` scope (for pulling Rayfin container images from GHCR):  
> `gh auth refresh -s read:packages`

### Option B — Deploy to Microsoft Fabric (recommended for this demo)

```bash
# 1. Enable "Fabric Apps (preview)" in your Fabric tenant admin portal
#    → https://app.fabric.microsoft.com/admin-portal → Tenant settings

# 2. Clone & install
git clone https://github.com/alessioandriuloagic/rayfin-seismic-dashboard
cd rayfin-seismic-dashboard
npm install

# 3. Deploy to Fabric (will open browser for sign-in on first run)
npx rayfin up --workspace <your-workspace-name>

# 4. Start local Vite dev server pointing at the Fabric backend
npm run dev
```

After `rayfin up` completes, the CLI prints:
- **App URL** — public URL of the deployed app (Fabric SSO required)
- **Portal link** — manage the Fabric App item in the portal
- **Deployment ID** — for reference

> **Tested with:** `npx rayfin up --workspace ws_fabric_deploy`  
> Deployed to West Europe region at `fond-poppy-fcf5574772-westeurope.webapp.fabricapps.net`.

---

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Deploy to Fabric + start Vite dev server |
| `npm run dev:local` | Start Docker backend + Vite dev server (no Fabric) |
| `npm run up` | Deploy to Fabric without starting dev server |
| `npm run build` | Type-check + production build |
| `npm run rayfin:db` | Apply schema changes to the remote database |

---

## Data model

```typescript
// rayfin/data/Earthquake.ts
@entity()
@role('authenticated', '*')
export class Earthquake {
  @uuid()    id!: string;        // Rayfin primary key
  @int()     eventId!: number;   // INGV event ID (used for dedup)
  @text()    time!: string;      // ISO 8601 origin time
  @decimal() magnitude!: number; // Richter / ML value
  @text()    magType!: string;   // ML, Mw, Md, …
  @text()    place!: string;     // Human-readable location
  @decimal() latitude!: number;  // WGS-84
  @decimal() longitude!: number; // WGS-84
  @decimal() depth!: number;     // km
  @text()    author!: string;    // SURVEY-INGV
  @text({ optional: true }) magAuthor?: string;
  @text()    quakeType!: string; // earthquake, quarry blast, …
}
```

Rayfin generates:
- SQL table `Earthquake` in the Fabric SQL Database child item
- GraphQL endpoint at `/api/graphql`
- Row-level security (authenticated users only)

---

## Sync strategy (near-realtime)

The `useEarthquakeSync` hook implements a simple **polling + dedup** pattern:

1. Every **5 minutes**, fetch the last 24 h of events from INGV
2. Load all stored `eventId` values from Rayfin in one query
3. Insert only events not already stored
4. Expose a **"Sync now"** button for manual refresh

This approach:
- Avoids duplicates without needing upsert support
- Is resilient to network failures (next poll catches up)
- Works equally well in local Docker and Fabric deployed environments

---

## Limitations of this demo

| Area | Current status |
|---|---|
| **Polling** | Client-side. For production, a Rayfin Function or external scheduler would be more efficient |
| **Dedup query** | `select(['eventId']).execute()` fetches all eventIds — fine for 24 h window, would need pagination for longer retention |
| **No historical backfill** | Only the last 24 h are synced on each poll |
| **Auth** | Fabric SSO only in production; no anonymous read support |

---

## Related resources

- [Rayfin GitHub](https://github.com/microsoft/rayfin)
- [Rayfin documentation](https://aka.ms/rayfin/docs)
- [Fabric Apps overview](https://learn.microsoft.com/en-us/fabric/apps/overview)
- [INGV FDSN Event API](https://webservices.ingv.it/fdsnws/event/1/)

---

## Deployment notes

| | |
|---|---|
| **Workspace** | `ws_fabric_deploy` |
| **Region** | West Europe |
| **App URL** | https://fond-poppy-fcf5574772-westeurope.webapp.fabricapps.net |
| **Auth modes tested** | Fabric SSO (production), email/password (local Docker) |
| **Rayfin CLI command** | `npx rayfin up --workspace ws_fabric_deploy` |
| **Last tested** | 2026-06-06 |
- [awesome-rayfin templates](https://github.com/microsoft/awesome-rayfin)

---

## License

MIT
