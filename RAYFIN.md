# Rayfin — Guida d'uso

> **Rayfin** è il Backend-as-a-Service AI-first di Microsoft, che gira su Microsoft Fabric.  
> Fornisce autenticazione, database SQL, API GraphQL e static hosting — tutto dichiarativo, senza infrastruttura da gestire.

---

## Indice

1. [Cos'è Rayfin](#cosè-rayfin)
2. [Installazione e prerequisiti](#installazione-e-prerequisiti)
3. [Struttura del progetto](#struttura-del-progetto)
4. [Configurazione — `rayfin.yml`](#configurazione--rayfinyml)
5. [Data model — `@entity()`](#data-model--entity)
6. [Schema type — collegare il client TypeScript](#schema-type--collegare-il-client-typescript)
7. [Client TypeScript](#client-typescript)
8. [Autenticazione](#autenticazione)
9. [Operazioni CRUD](#operazioni-crud)
10. [Comandi CLI](#comandi-cli)
11. [Variabili d'ambiente](#variabili-dambiente)
12. [Deploy su Microsoft Fabric](#deploy-su-microsoft-fabric)
13. [Sviluppo locale (Docker)](#sviluppo-locale-docker)
14. [Ciclo di vita tipico](#ciclo-di-vita-tipico)

---

## Cos'è Rayfin

Rayfin offre quattro servizi integrati, configurabili in un singolo file YAML:

| Servizio | Cosa fa |
|---|---|
| **`auth`** | Autenticazione con Entra ID SSO (Fabric) o email/password. Gestisce JWT, refresh token e sessioni. |
| **`data`** | Genera automaticamente una tabella SQL in Fabric e un endpoint GraphQL per ogni `@entity()`. |
| **`staticHosting`** | Serve la SPA (bundle Vite/React) direttamente dall'app Fabric. |
| **`functions`** | Esegue funzioni serverless (non usato in questo progetto). |

L'intera infrastruttura backend — SQL Database in Fabric, GraphQL API, autenticazione Entra — viene creata e aggiornata dal CLI con un singolo comando.

---

## Installazione e prerequisiti

```bash
# CLI (devDependency nel progetto)
npm install --save-dev @microsoft/rayfin-cli

# Pacchetti runtime
npm install @microsoft/rayfin-client \
            @microsoft/rayfin-auth \
            @microsoft/rayfin-auth-provider-fabric \
            @microsoft/rayfin-core
```

**Prerequisiti Fabric:**

| Requisito | Note |
|---|---|
| Microsoft Fabric F2+ capacity | Necessaria per ospitare l'app |
| "Fabric Apps (preview)" abilitato | Tenant settings nel portale admin |
| Azure CLI autenticato | `az login` prima di `rayfin up` |

**Per sviluppo locale:**

```bash
# Docker Desktop in esecuzione
# GitHub CLI autenticato con scope read:packages
gh auth refresh -s read:packages
```

---

## Struttura del progetto

```
rayfin/
├── rayfin.yml          ← configurazione del backend
└── data/
    ├── Earthquake.ts   ← definizione entità (genera tabella SQL + GraphQL)
    └── schema.ts       ← mappa delle entità per il client TypeScript tipato
```

I file in `rayfin/data/` sono la **source of truth** del backend: ogni classe decorata con `@entity()` diventa una tabella SQL e un resolver GraphQL.

---

## Configurazione — `rayfin.yml`

```yaml
id: seismic-dashboard          # identificatore univoco dell'app Fabric
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
      enabled: true        # Entra ID SSO in produzione
    password:
      enabled: true        # email/password per dev locale

  data:
    enabled: true
    dialect: mssql         # SQL Database in Fabric

  storage:
    enabled: false

  staticHosting:
    enabled: true
    root: .                # cartella root del progetto
    folder: dist           # output del build Vite
    buildCommand: npm run build
    indexDocument: index.html

  functions:
    enabled: false
```

**Punti chiave:**

- `allowedRedirectUris` — deve includere tutti gli URL da cui l'app viene aperta (localhost per dev, URL Fabric per produzione).
- `dialect: mssql` — il database viene creato come "SQL Database" figlio dell'app Fabric.
- `staticHosting.buildCommand` — Rayfin esegue questo comando prima del deploy e carica il `folder` risultante.

---

## Data model — `@entity()`

Ogni entità viene definita come classe TypeScript con decoratori:

```typescript
// rayfin/data/Earthquake.ts
import { entity, role, uuid, text, int, decimal } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')   // solo utenti autenticati possono leggere/scrivere
export class Earthquake {
  @uuid()    id!: string;        // chiave primaria auto-generata
  @int()     eventId!: number;   // intero 32-bit
  @text()    time!: string;      // stringa UTF-8
  @decimal() magnitude!: number; // numero decimale (precision configurabile)
  @text()    magType!: string;
  @text()    place!: string;
  @decimal() latitude!: number;
  @decimal() longitude!: number;
  @decimal() depth!: number;
  @text()    author!: string;
  @text({ optional: true }) magAuthor?: string;  // campo nullable
  @text()    quakeType!: string;
}
```

**Decoratori disponibili:**

| Decoratore | Tipo SQL | Note |
|---|---|---|
| `@uuid()` | `uniqueidentifier` | Chiave primaria, auto-generated |
| `@text()` | `nvarchar(max)` | `{ optional: true }` → nullable |
| `@int()` | `int` | 32-bit signed |
| `@decimal()` | `decimal(18,8)` | Scala configurabile |
| `@role(role, permissions)` | — | Row-level security |

**`@role('authenticated', '*')`** — `*` significa tutti i permessi (select, insert, update, delete). Si può restringere a `'read'`, `'write'`, ecc.

Dopo ogni modifica al data model, applicare le migrazioni:

```bash
npx rayfin up db apply
# oppure
npm run rayfin:db
```

---

## Schema type — collegare il client TypeScript

```typescript
// rayfin/data/schema.ts
import type { Earthquake } from './Earthquake.js';

export type SeismicSchema = {
  Earthquake: Earthquake;   // nome entità → classe
};
```

Questo tipo viene passato al `RayfinClient` per ottenere accesso tipato a `client.data.Earthquake`.  
Per aggiungere una nuova entità: creare il file in `rayfin/data/`, aggiungere la voce in `SeismicSchema`.

---

## Client TypeScript

```typescript
// src/lib/rayfin.ts
import { RayfinClient } from '@microsoft/rayfin-client';
import type { SeismicSchema } from '../../rayfin/data/schema.js';

export const client = new RayfinClient<SeismicSchema>({
  baseUrl: import.meta.env.VITE_RAYFIN_API_URL ?? 'http://localhost:5168',
  publishableKey: import.meta.env.VITE_RAYFIN_PUBLISHABLE_KEY ?? '',
});
```

Il client è un **singleton**: va istanziato una volta e importato dove serve.

- `baseUrl` — impostato automaticamente da `rayfin up` / `rayfin dev` tramite variabili d'ambiente Vite.
- `publishableKey` — chiave pubblica del progetto, iniettata dal CLI.

---

## Autenticazione

### Fabric SSO (produzione)

```typescript
import { ensureSignedInWithFabric } from '@microsoft/rayfin-auth-provider-fabric';

await ensureSignedInWithFabric(client.auth, {
  workspaceId: import.meta.env.VITE_FABRIC_WORKSPACE_ID,
  projectId:   import.meta.env.VITE_FABRIC_ITEM_ID,
  fabricPortalUrl: 'https://app.fabric.microsoft.com',
  returnOrigin: window.location.origin,
});
```

`ensureSignedInWithFabric` rileva se l'app gira dentro un iframe del portale Fabric e gestisce il token SSO Entra ID senza reindirizzamenti visibili.

### Email / password (sviluppo locale)

```typescript
await client.auth.signIn({ email, password });
```

### Stato della sessione

```typescript
// Lettura sincrona
const session = client.auth.getSession();
session?.isAuthenticated  // boolean
session?.user?.email      // string | undefined

// Sottoscrizione ai cambiamenti
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

## Operazioni CRUD

### Read — `select().orderBy().first().executePaginated()`

```typescript
const page = await client.data.Earthquake
  .select(['id', 'eventId', 'time', 'magnitude', 'place', 'latitude', 'longitude'])
  .orderBy({ time: 'desc' })
  .first(500)
  .executePaginated();

const items: Earthquake[] = page.items;
```

- `.select([...fields])` — proiezione dei campi (evita di caricare colonne inutili).
- `.orderBy({ field: 'asc' | 'desc' })` — ordinamento lato server.
- `.first(n)` — limita i risultati a `n` record.
- `.executePaginated()` — restituisce `{ items, cursor, hasMore }`.
- `.execute()` — restituisce direttamente l'array (senza info di paginazione).

### Read leggero per deduplication

```typescript
// Carica solo un campo per minimizzare il payload
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
  place:     'Zona Appenninica Centrale',
  latitude:  42.35,
  longitude: 13.40,
  depth:     10.2,
  author:    'SURVEY-INGV',
  quakeType: 'earthquake',
  // magAuthor è optional: omettere o passare undefined
});
```

Il campo `id` è auto-generato da Rayfin, non va passato.

### Update e Delete

```typescript
// Update per id
await client.data.Earthquake.update('uuid-qui', { magnitude: 2.5 });

// Delete per id
await client.data.Earthquake.delete('uuid-qui');
```

---

## Comandi CLI

Tutti i comandi si invocano con `npx rayfin <comando>` oppure tramite gli script `package.json`.

| Comando | Script npm | Cosa fa |
|---|---|---|
| `rayfin up --workspace <nome>` | `npm run up` | Deploya l'app su Fabric (build + schema + hosting) |
| `rayfin dev` | `npm run dev` | Deploy su Fabric + avvia Vite dev server puntato al backend Fabric |
| `rayfin dev --local` | `npm run dev:local` | Avvia il backend Rayfin in Docker + Vite dev server locale |
| `rayfin up db apply` | `npm run rayfin:db` | Applica le migrazioni dello schema al database remoto |

### `rayfin up` — flusso dettagliato

```
rayfin up --workspace ws_fabric_deploy
```

1. Autenticazione con Azure (apre il browser al primo run).
2. Legge `rayfin.yml` per la configurazione.
3. Esegue `npm run build` (TypeScript check + Vite bundle).
4. Crea o aggiorna il "Fabric App" item nel workspace indicato.
5. Applica le migrazioni SQL per le entità modificate.
6. Carica il bundle `dist/` sul server di static hosting.
7. Stampa l'**App URL** pubblico e il **Portal link**.

> **Nota:** Se il workspace non esiste, il CLI restituisce errore (exit code 1). Il workspace deve essere pre-esistente nel tenant Fabric.

---

## Variabili d'ambiente

Le variabili vengono iniettate automaticamente da `rayfin up` / `rayfin dev` nel file `.env.local` (non committare questo file).

| Variabile | Quando presente | Descrizione |
|---|---|---|
| `VITE_RAYFIN_API_URL` | Sempre | URL base del backend (`http://localhost:5168` in locale, URL Fabric in produzione) |
| `VITE_RAYFIN_PUBLISHABLE_KEY` | Sempre | Chiave pubblica per l'autenticazione client |
| `VITE_FABRIC_WORKSPACE_ID` | Solo deploy Fabric | ID del workspace Fabric |
| `VITE_FABRIC_ITEM_ID` | Solo deploy Fabric | ID dell'app item Fabric (usato per SSO) |
| `VITE_FABRIC_PORTAL_URL` | Solo deploy Fabric | URL del portale Fabric |

Il check `Boolean(import.meta.env.VITE_FABRIC_ITEM_ID)` è il modo idiomatico per rilevare se si è in un deploy Fabric o in locale.

---

## Deploy su Microsoft Fabric

### Prima volta

1. **Abilitare "Fabric Apps (preview)"** nel tenant:  
   → [app.fabric.microsoft.com/admin-portal](https://app.fabric.microsoft.com/admin-portal) → Tenant settings → Developer settings

2. **Autenticarsi con Azure CLI:**
   ```bash
   az login
   ```

3. **Deploy:**
   ```bash
   npx rayfin up --workspace <nome-workspace>
   ```

4. Al termine il CLI stampa l'URL pubblico dell'app.

### Deploy successivi

```bash
# Rideploya tutto (build + schema + bundle)
npx rayfin up --workspace <nome-workspace>

# Solo migrazioni schema (senza rebuild frontend)
npx rayfin up db apply
```

### Workspace testato

```
npx rayfin up --workspace ws_fabric_deploy
```

App URL: `https://fond-poppy-fcf5574772-westeurope.webapp.fabricapps.net`

---

## Sviluppo locale (Docker)

```bash
# Prerequisiti: Docker Desktop in esecuzione, gh autenticato con read:packages
gh auth refresh -s read:packages

npm run dev:local
```

Rayfin avvia un container Docker con:
- Backend GraphQL su `http://localhost:5168`
- Database SQL locale (SQLite o SQL Server Express)
- Auth email/password abilitata

Aprire [http://localhost:5173](http://localhost:5173) e registrare un utente al primo accesso.

---

## Ciclo di vita tipico

```
1. Definire l'entità
   rayfin/data/MyEntity.ts   ← aggiungere classe con @entity()
   rayfin/data/schema.ts     ← aggiungere la voce in SeismicSchema

2. Sviluppare in locale
   npm run dev:local         ← backend Docker + Vite dev server

3. Usare il client nel codice React
   client.data.MyEntity.select([...]).execute()
   client.data.MyEntity.create({...})

4. Applicare le migrazioni al database remoto
   npm run rayfin:db         ← rayfin up db apply

5. Deploy su Fabric
   npx rayfin up --workspace <workspace>

6. Verificare sul portale Fabric
   https://app.fabric.microsoft.com → Workspace → App item
```

---

## Risorse

- [Rayfin GitHub](https://github.com/microsoft/rayfin)
- [Rayfin documentazione](https://aka.ms/rayfin/docs)
- [Fabric Apps overview](https://learn.microsoft.com/en-us/fabric/apps/overview)
- [Microsoft Fabric Admin Portal](https://app.fabric.microsoft.com/admin-portal)
