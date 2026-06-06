# Rayfin — Usage Guide

> **Rayfin** is Microsoft's AI-first Backend-as-a-Service, running on Microsoft Fabric.  
> It provides authentication, SQL database, GraphQL API, and static hosting — all declarative, with no infrastructure to manage.

---

## Table of Contents

1. [What is Rayfin](#what-is-rayfin)
2. [Installation & prerequisites](#installation--prerequisites)
3. [Project structure](#project-structure)
4. [Configuration — `rayfin.yml`](#configuration--rayfinyml)
5. [Data model — `@entity()`](#data-model--entity)
6. [Schema type — wiring the TypeScript client](#schema-type--wiring-the-typescript-client)
7. [TypeScript client](#typescript-client)
8. [Authentication](#authentication)
9. [CRUD operations](#crud-operations)
10. [CLI commands](#cli-commands)
11. [Environment variables](#environment-variables)
12. [Deploy to Microsoft Fabric](#deploy-to-microsoft-fabric)
13. [Local development (Docker)](#local-development-docker)
14. [Typical lifecycle](#typical-lifecycle)

---

## What is Rayfin

Rayfin provides four integrated services, all configurable in a single YAML file:

| Service | What it does |
|---|---|
| **`auth`** | Authentication via Entra ID SSO (Fabric) or email/password. Manages JWT tokens, refresh tokens, and sessions. |
| **`data`** | Automatically generates a SQL table in Fabric and a GraphQL endpoint for every `@entity()`. |
| **`staticHosting`** | Serves the SPA (Vite/React bundle) directly from the Fabric app. |
| **`functions`** | Runs serverless functions (not used in this project). |

The entire backend infrastructure — SQL Database in Fabric, GraphQL API, Entra authentication — is created and updated by the CLI with a single command.

---

## Installation & prerequisites

```bash
# CLI (devDependency in the project)
npm install --save-dev @microsoft/rayfin-cli

# Runtime packages
npm install @microsoft/rayfin-client \
            @microsoft/rayfin-auth \
            @microsoft/rayfin-auth-provider-fabric \
            @microsoft/rayfin-core
```

**Fabric prerequisites:**

| Requirement | Notes |
|---|---|
| Microsoft Fabric F2+ capacity | Required to host the app |
| "Fabric Apps (preview)" enabled | Tenant settings in the admin portal |
| Azure CLI authenticated | `az login` before running `rayfin up` |

**For local development:**

```bash
# Docker Desktop must be running
# GitHub CLI authenticated with read:packages scope
gh auth refresh -s read:packages
```

---

## Project structure

```
rayfin/
├── rayfin.yml          ← backend configuration
└── data/
    ├── Earthquake.ts   ← entity definition (generates SQL table + GraphQL)
    └── schema.ts       ← entity map for the typed TypeScript client
```

Files in `rayfin/data/` are the **source of truth** for the backend: every class decorated with `@entity()` becomes a SQL table and a GraphQL resolver.

---

## Configuration — `rayfin.yml`

```yaml
id: seismic-dashboard          # unique identifier for the Fabric app
name: Seismic Dashboard
version: 0.1.0

services:
  auth:
    enabled: true
    expiryInMinutes: 60
    refreshToken:
      lifetimeInDays: 30
    allowedRedirectUris:
      - http://localhost:5173
      - http://localhost:5173/auth/callback
      - https://fond-poppy-fcf5574772-westeurope.webapp.fabricapps.net
    fabric:
      enabled: true        # Entra ID SSO in production
    password:
      enabled: true        # email/password for local dev

  data:
    enabled: true
    dialect: mssql         # SQL Database in Fabric

  storage:
    enabled: false

  staticHosting:
    enabled: true
    root: .                # project root folder
    folder: dist           # Vite build output
    buildCommand: npm run build
    indexDocument: index.html

  functions:
    enabled: false
```

**Key points:**

- `allowedRedirectUris` — must include every URL from which the app is opened (localhost for dev, Fabric URL for production).
- `dialect: mssql` — the database is created as a "SQL Database" child item of the Fabric app.
- `staticHosting.buildCommand` — Rayfin runs this command before deploying and uploads the resulting `folder`.

---

## Data model — `@entity()`

Each entity is defined as a TypeScript class with decorators:

```typescript
// rayfin/data/Earthquake.ts
import { entity, role, uuid, text, int, decimal } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')   // only authenticated users can read/write
export class Earthquake {
  @uuid()    id!: string;        // auto-generated primary key
  @int()     eventId!: number;   // 32-bit integer
  @text()    time!: string;      // UTF-8 string
  @decimal() magnitude!: number; // decimal number (configurable precision)
  @text()    magType!: string;
  @text()    place!: string;
  @decimal() latitude!: number;
  @decimal() longitude!: number;
  @decimal() depth!: number;
  @text()    author!: string;
  @text({ optional: true }) magAuthor?: string;  // nullable field
  @text()    quakeType!: string;
}
```

**Available decorators:**

| Decorator | SQL type | Notes |
|---|---|---|
| `@uuid()` | `uniqueidentifier` | Primary key, auto-generated |
| `@text()` | `nvarchar(max)` | `{ optional: true }` → nullable |
| `@int()` | `int` | 32-bit signed |
| `@decimal()` | `decimal(18,8)` | Configurable scale |
| `@role(role, permissions)` | — | Row-level security |

**`@role('authenticated', '*')`** — `*` grants all permissions (select, insert, update, delete). Can be narrowed to `'read'`, `'write'`, etc.

After every data model change, apply migrations:

```bash
npx rayfin up db apply
# or
npm run rayfin:db
```

---

## Schema type — wiring the TypeScript client

```typescript
// rayfin/data/schema.ts
import type { Earthquake } from './Earthquake.js';

export type SeismicSchema = {
  Earthquake: Earthquake;   // entity name → class
};
```

This type is passed to `RayfinClient` to get typed access to `client.data.Earthquake`.  
To add a new entity: create the file in `rayfin/data/`, then add the entry to `SeismicSchema`.

---

## TypeScript client

```typescript
// src/lib/rayfin.ts
import { RayfinClient } from '@microsoft/rayfin-client';
import type { SeismicSchema } from '../../rayfin/data/schema.js';

export const client = new RayfinClient<SeismicSchema>({
  baseUrl: import.meta.env.VITE_RAYFIN_API_URL ?? 'http://localhost:5168',
  publishableKey: import.meta.env.VITE_RAYFIN_PUBLISHABLE_KEY ?? '',
});
```

The client is a **singleton**: instantiate it once and import it wherever needed.

- `baseUrl` — automatically set by `rayfin up` / `rayfin dev` via Vite environment variables.
- `publishableKey` — project public key, injected by the CLI.

---

## Authentication

### Fabric SSO (production)

```typescript
import { ensureSignedInWithFabric } from '@microsoft/rayfin-auth-provider-fabric';

await ensureSignedInWithFabric(client.auth, {
  workspaceId: import.meta.env.VITE_FABRIC_WORKSPACE_ID,
  projectId:   import.meta.env.VITE_FABRIC_ITEM_ID,
  fabricPortalUrl: 'https://app.fabric.microsoft.com',
  returnOrigin: window.location.origin,
});
```

`ensureSignedInWithFabric` detects whether the app is running inside a Fabric portal iframe and handles the Entra ID SSO token without visible redirects.

### Email / password (local development)

```typescript
await client.auth.signIn({ email, password });
```

### Session state

```typescript
// Synchronous read
const session = client.auth.getSession();
session?.isAuthenticated  // boolean
session?.user?.email      // string | undefined

// Subscribe to changes
const unsubscribe = client.auth.onSessionChange((session) => {
  console.log(session?.isAuthenticated);
});
// cleanup
unsubscribe();
```

### Sign out

```typescript
await client.auth.signOut();
```

---

## CRUD operations

### Read — `select().orderBy().first().executePaginated()`

```typescript
const page = await client.data.Earthquake
  .select(['id', 'eventId', 'time', 'magnitude', 'place', 'latitude', 'longitude'])
  .orderBy({ time: 'desc' })
  .first(500)
  .executePaginated();

const items: Earthquake[] = page.items;
```

- `.select([...fields])` — field projection (avoids loading unused columns).
- `.orderBy({ field: 'asc' | 'desc' })` — server-side ordering.
- `.first(n)` — limits results to `n` records.
- `.executePaginated()` — returns `{ items, cursor, hasMore }`.
- `.execute()` — returns the array directly (no pagination info).

### Lightweight read for deduplication

```typescript
// Load only one field to minimise the payload
const existing = await client.data.Earthquake.select(['eventId']).execute();
const existingIds = new Set(existing.map((e) => e.eventId));
```

### Create

```typescript
await client.data.Earthquake.create({
  eventId:   12345,
  time:      '2026-06-06T10:30:00Z',
  magnitude: 2.4,
  magType:   'ML',
  place:     'Central Apennines Zone',
  latitude:  42.35,
  longitude: 13.40,
  depth:     10.2,
  author:    'SURVEY-INGV',
  quakeType: 'earthquake',
  // magAuthor is optional: omit or pass undefined
});
```

The `id` field is auto-generated by Rayfin — do not pass it.

### Update and Delete

```typescript
// Update by id
await client.data.Earthquake.update('uuid-here', { magnitude: 2.5 });

// Delete by id
await client.data.Earthquake.delete('uuid-here');
```

---

## CLI commands

All commands are invoked with `npx rayfin <command>` or via `package.json` scripts.

| Command | npm script | What it does |
|---|---|---|
| `rayfin up --workspace <name>` | `npm run up` | Deploys the app to Fabric (build + schema + hosting) |
| `rayfin dev` | `npm run dev` | Deploys to Fabric + starts Vite dev server pointed at the Fabric backend |
| `rayfin dev --local` | `npm run dev:local` | Starts the Rayfin backend in Docker + local Vite dev server |
| `rayfin up db apply` | `npm run rayfin:db` | Applies schema migrations to the remote database |

### `rayfin up` — detailed flow

```
rayfin up --workspace ws_fabric_deploy
```

1. Azure authentication (opens the browser on first run).
2. Reads `rayfin.yml` for configuration.
3. Runs `npm run build` (TypeScript check + Vite bundle).
4. Creates or updates the "Fabric App" item in the specified workspace.
5. Applies SQL migrations for changed entities.
6. Uploads the `dist/` bundle to the static hosting server.
7. Prints the public **App URL** and the **Portal link**.

> **Note:** If the workspace does not exist, the CLI returns an error (exit code 1). The workspace must already exist in the Fabric tenant.

---

## Environment variables

Variables are automatically injected by `rayfin up` / `rayfin dev` into `.env.local` (do not commit this file).

| Variable | When present | Description |
|---|---|---|
| `VITE_RAYFIN_API_URL` | Always | Backend base URL (`http://localhost:5168` locally, Fabric URL in production) |
| `VITE_RAYFIN_PUBLISHABLE_KEY` | Always | Public key for client authentication |
| `VITE_FABRIC_WORKSPACE_ID` | Fabric deploy only | Fabric workspace ID |
| `VITE_FABRIC_ITEM_ID` | Fabric deploy only | Fabric app item ID (used for SSO) |
| `VITE_FABRIC_PORTAL_URL` | Fabric deploy only | Fabric portal URL |

The check `Boolean(import.meta.env.VITE_FABRIC_ITEM_ID)` is the idiomatic way to detect whether the app is running on a Fabric deploy or locally.

---

## Deploy to Microsoft Fabric

### First time

1. **Enable "Fabric Apps (preview)"** in the tenant:  
   → [app.fabric.microsoft.com/admin-portal](https://app.fabric.microsoft.com/admin-portal) → Tenant settings → Developer settings

2. **Authenticate with Azure CLI:**
   ```bash
   az login
   ```

3. **Deploy:**
   ```bash
   npx rayfin up --workspace <workspace-name>
   ```

4. When complete, the CLI prints the public URL of the app.

### Subsequent deploys

```bash
# Redeploy everything (build + schema + bundle)
npx rayfin up --workspace <workspace-name>

# Schema migrations only (no frontend rebuild)
npx rayfin up db apply
```

### Tested workspace

```
npx rayfin up --workspace ws_fabric_deploy
```

App URL: `https://fond-poppy-fcf5574772-westeurope.webapp.fabricapps.net`

---

## Local development (Docker)

```bash
# Prerequisites: Docker Desktop running, gh authenticated with read:packages
gh auth refresh -s read:packages

npm run dev:local
```

Rayfin starts a Docker container with:
- GraphQL backend at `http://localhost:5168`
- Local SQL database (SQLite or SQL Server Express)
- Email/password auth enabled

Open [http://localhost:5173](http://localhost:5173) and register a user on first access.

---

## Typical lifecycle

```
1. Define the entity
   rayfin/data/MyEntity.ts   ← add class with @entity()
   rayfin/data/schema.ts     ← add the entry to SeismicSchema

2. Develop locally
   npm run dev:local         ← Docker backend + Vite dev server

3. Use the client in React code
   client.data.MyEntity.select([...]).execute()
   client.data.MyEntity.create({...})

4. Apply migrations to the remote database
   npm run rayfin:db         ← rayfin up db apply

5. Deploy to Fabric
   npx rayfin up --workspace <workspace>

6. Verify in the Fabric portal
   https://app.fabric.microsoft.com → Workspace → App item
```

---

## Resources

- [Rayfin GitHub](https://github.com/microsoft/rayfin)
- [Rayfin documentation](https://aka.ms/rayfin/docs)
- [Fabric Apps overview](https://learn.microsoft.com/en-us/fabric/apps/overview)
- [Microsoft Fabric Admin Portal](https://app.fabric.microsoft.com/admin-portal)
