# Kundenportal (Teil 2) – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pflegedienste pflegen Stellen, Bewerbungen und Profil selbst im Portal unter `/portal`; Dienst wird am Hostnamen erkannt; Erinnerungen und Monatsreport laufen automatisch.

**Architecture:** Eine Nuxt-Instanz für alle Dienste. Server-Middleware löst Host → Dienst auf. Portal-Routen unter `server/api/portal/*` prüfen die Session (nuxt-auth-utils, versiegeltes Cookie) und filtern alles nach dem Dienst der Session. Schreibzugriffe auf Directus laufen ausschließlich über ein Token der Rolle „App“ (`server/utils/directus.ts`). Reine Logik (Host-Auflösung, Token, Vorlagen, Aggregationen, Schemas) liegt in `shared/utils/` mit Unit-Tests. Hintergrund-Jobs als Nitro-Tasks mit Endpoint-Fallback.

**Tech Stack:** Nuxt 4, nuxt-auth-utils, Directus 11, zod 3, nodemailer, Node-Test-Runner.

**Spec:** `docs/superpowers/specs/2026-10-02-kundenportal-design.md` (baut auf `2026-10-02-pflege-stellenseite-design.md`)

## Global Constraints

- Schema nur über `scripts/setup-schema-portal.mjs` (plus bestehende Skripte); keine Handarbeit in Directus.
- `applications`, `portal_users`, `login_tokens`, `job_views`: für Public weder lesbar noch anlegbar. Public-Create auf `applications` wird entfernt.
- Server-Routen nutzen nur `DIRECTUS_APP_TOKEN` (Rolle „App“). `DIRECTUS_ADMIN_TOKEN` nur in `scripts/`.
- Jede `/api/portal/*`-Route filtert serverseitig nach `employer.id` aus `requirePortalUser(event)`; IDs aus dem Request werden nie ohne diesen Filter benutzt.
- Login-Token: 32 Bytes base64url, nur als SHA-256-Hash gespeichert, 15 Minuten gültig, einmalig. Session-Cookie 30 Tage. `request-link` antwortet immer `{ ok: true }`.
- `dienst`-Nutzer nur auf einem Host ihres Dienstes; `rhowerk` überall.
- Erinnerung genau einmal pro Bewerbung (`reminder_sent_at`), nach 24 h auf `neu`. Report am 1. des Monats für den Vormonat.
- Das Portal versendet keine Nachrichten an Bewerber.
- Sichtbarkeitsregel aus Teil 1 bleibt: `status = published` und `valid_through >= heute`.
- Commits auf Deutsch, letzte Zeile `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Keine Werte aus `.env` ausgeben. Dev-Server nur eigenen PID beenden.

## Review Focus

1. **Host mit Port oder Großschreibung** (`Sonnenhof.Pflege-Jobs.de:3000`) muss denselben Dienst finden wie `sonnenhof.pflege-jobs.de`. → Test in Task 3.
2. **Abgelaufener oder bereits benutzter Login-Link** darf keine Session setzen, auch nicht bei korrektem Hash. → Test in Task 6 (`isTokenUsable`).
3. **Bewerbung gehört einem anderen Dienst**: `PATCH /api/portal/applications/:id` eines fremden Dienstes muss 404 liefern, nicht die Bewerbung ändern. → Test der Filterfunktion in Task 9 und manueller Schritt.
4. **Erinnerung am Monatswechsel / Zeitzone**: Kandidatenauswahl rechnet mit Zeitstempeln, nicht mit Datums-Strings; Bewerbung genau 24 h alt zählt, 23 h 59 min nicht. → Test in Task 11.
5. **Report ohne Daten**: Dienst ohne Stellen im Vormonat bekommt keine Mail; Dienst mit Stellen, aber ohne Bewerbungen, bekommt eine Mail mit Nullen und ohne Division durch null beim Median. → Test in Task 11.

---

### Task 1: Grundlagen: Abhängigkeiten, Konfiguration, App-Client

**Files:**
- Modify: `package.json`, `nuxt.config.ts`, `.env.example`, `.env`
- Create: `server/utils/directus.ts`

**Interfaces:**
- Produces: `appFetch<T>(path: string, opts?: { method?: string; query?: Record<string, any>; body?: any }): Promise<T>` – ruft `${directusUrl}${path}` mit `Authorization: Bearer <DIRECTUS_APP_TOKEN>`, Timeout 8 s, wirft `createError(503)` bei Netzwerkfehler und reicht Directus-Statuscodes (400/403/404) als `createError` mit gleichem Status durch. `appItems<T>(collection, query)` → `T[]` (liest `data`). `appItem<T>(collection, id, query)` → `T | null`.
- `runtimeConfig`: `directusAppToken`, `taskSecret`, `portalBaseUrl`, `session: { maxAge: 2592000 }`.

- [ ] **Step 1: Abhängigkeit und Konfiguration**

```bash
yarn add nuxt-auth-utils
```
In `nuxt.config.ts`: `modules` um `'nuxt-auth-utils'` ergänzen. `runtimeConfig` erweitern:
```ts
runtimeConfig: {
  public: { siteName, siteUrl: process.env.SITE_URL, directusUrl: process.env.DIRECTUS_URL, employerSlug: process.env.EMPLOYER_SLUG },
  redirects: { cacheSeconds: 300 },
  notifyBcc: process.env.NOTIFY_BCC || '',
  mail: { host: '', port: '587', secure: 'false', user: '', pass: '', from: '' },
  directusAppToken: process.env.DIRECTUS_APP_TOKEN || '',
  taskSecret: process.env.TASK_SECRET || '',
  portalBaseUrl: process.env.PORTAL_BASE_URL || '',
  session: { maxAge: 60 * 60 * 24 * 30 },
},
nitro: { experimental: { tasks: true }, scheduledTasks: { '0 * * * *': ['reminders'], '0 6 * * *': ['report'] } },
```
`.env.example` und `.env` ergänzen:
```
DIRECTUS_APP_TOKEN=
NUXT_SESSION_PASSWORD=
TASK_SECRET=
PORTAL_BASE_URL=
```
In `.env` für `NUXT_SESSION_PASSWORD` und `TASK_SECRET` je einen Zufallswert eintragen: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (Werte nicht ausgeben).

- [ ] **Step 2: App-Client**

```ts
// server/utils/directus.ts
// Directus-Zugriff des Servers mit dem Token der Rolle „App“. Alle Portal- und Schreibzugriffe laufen hier durch.
const TIMEOUT_MS = 8000

export async function appFetch<T = any>(path: string, opts: { method?: string; query?: Record<string, any>; body?: any } = {}): Promise<T> {
  const config = useRuntimeConfig()
  const base = config.public.directusUrl as string
  const token = config.directusAppToken as string
  if (!base || !token) throw createError({ statusCode: 503, statusMessage: 'CMS nicht konfiguriert' })
  try {
    return await $fetch<T>(`${base}${path}`, {
      method: opts.method as any, query: opts.query, body: opts.body, timeout: TIMEOUT_MS,
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err: any) {
    const status = err?.statusCode ?? err?.response?.status
    if (status && status >= 400 && status < 500) {
      throw createError({ statusCode: status, statusMessage: err?.data?.errors?.[0]?.message || 'Directus-Fehler' })
    }
    console.error('[directus] nicht erreichbar:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 503, statusMessage: 'Gerade nicht erreichbar' })
  }
}

export async function appItems<T = any>(collection: string, query: Record<string, any> = {}): Promise<T[]> {
  const res = await appFetch<{ data: T[] }>(`/items/${collection}`, { query: { limit: -1, ...query } })
  return res.data ?? []
}

export async function appItem<T = any>(collection: string, id: string, query: Record<string, any> = {}): Promise<T | null> {
  try {
    const res = await appFetch<{ data: T }>(`/items/${collection}/${id}`, { query })
    return res.data ?? null
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.statusCode === 403) return null
    throw err
  }
}
```
Hinweis: Directus liefert bei fehlender Leseberechtigung 403 statt 404; `appItem` behandelt beides als „nicht gefunden“.

- [ ] **Step 3: Prüfen und Commit**

```bash
yarn dev
```
Erwartet: Dev-Server startet ohne Fehler (nuxt-auth-utils warnt, falls `NUXT_SESSION_PASSWORD` fehlt). `/jobs` weiterhin 200. Dev-Server beenden.
```bash
git add package.json yarn.lock nuxt.config.ts .env.example server/utils/directus.ts
git commit -m "Portal-Grundlagen: nuxt-auth-utils, App-Token-Client, Konfiguration

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Schema Teil 2 und Rolle „App“

**Files:**
- Create: `scripts/setup-schema-portal.mjs`
- Modify: `scripts/lib/directus-admin.mjs` (neue Helfer), `scripts/setup-schema-jobs.mjs` (Public-Create entfernen), `package.json` (Script), `README.md`

**Interfaces:**
- Produces: Collections `portal_users`, `login_tokens`, `job_views`; neue Felder auf `employers` (`domains`, `notify_reminders`, `report_email`, `template_invite`, `template_reject`) und `applications` (`email`, `first_contact_at`, `reminder_sent_at`, `note`); Rolle „App“ mit Policy und Permissions; Directus-User `app@pflege-jobs.local` mit Static Token = `DIRECTUS_APP_TOKEN`.
- Helfer in `directus-admin.mjs`: `ensureRole(name)`, `ensurePolicy(name, { app_access })`, `ensureRoleHasPolicy(roleId, policyId)`, `ensurePermission(policyId, collection, action, { fields, permissions, validation })` (idempotent: aktualisiert bestehende), `removePublicPermission(collection, action)`, `ensureAppUser(roleId, email, token)`.

- [ ] **Step 1: Helfer in `scripts/lib/directus-admin.mjs` ergänzen**

```js
import { readRoles, createRole, readPolicies, createPolicy, readPermissions, createPermission, updatePermission, deletePermission, readUsers, createUser, updateUser } from '@directus/sdk';
// (bestehende Imports erweitern; readPolicies/readPermissions/createPermission sind schon da)

export async function ensureRole(name) {
  const found = await directus.request(readRoles({ filter: { name: { _eq: name } }, fields: ['id'], limit: 1 }));
  if (found.length) { console.log(`  = Rolle ${name} existiert`); return found[0].id; }
  const role = await directus.request(createRole({ name, icon: 'smart_toy', description: 'Server-Zugriff der Nuxt-App' }));
  console.log(`  + Rolle ${name} angelegt`);
  return role.id;
}

export async function ensurePolicy(name, { app_access = false } = {}) {
  const found = await directus.request(readPolicies({ filter: { name: { _eq: name } }, fields: ['id'], limit: 1 }));
  if (found.length) { console.log(`  = Policy ${name} existiert`); return found[0].id; }
  const policy = await directus.request(createPolicy({ name, icon: 'badge', admin_access: false, app_access, enforce_tfa: false }));
  console.log(`  + Policy ${name} angelegt`);
  return policy.id;
}

// Verknüpfung Rolle ↔ Policy über directus_access (Directus 11). Kein SDK-Helfer, daher roh.
export async function ensureRoleHasPolicy(roleId, policyId) {
  const res = await fetch(`${DIRECTUS_URL}/access?filter[role][_eq]=${roleId}&filter[policy][_eq]=${policyId}&fields=id`, { headers: authHeaders });
  const { data } = await res.json();
  if (data?.length) { console.log('  = Policy bereits an Rolle'); return; }
  const r = await fetch(`${DIRECTUS_URL}/access`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: roleId, policy: policyId }) });
  if (!r.ok) throw new Error(`Policy konnte nicht an Rolle gehängt werden: ${r.status}`);
  console.log('  + Policy an Rolle gehängt');
}

export async function ensurePermission(policy, collection, action, { fields = ['*'], permissions = {}, validation = {} } = {}) {
  const existing = await directus.request(readPermissions({ filter: { policy: { _eq: policy }, collection: { _eq: collection }, action: { _eq: action } }, fields: ['id'] }));
  if (existing.length) {
    await directus.request(updatePermission(existing[0].id, { fields, permissions, validation }));
    console.log(`  ~ ${action} auf ${collection} aktualisiert`);
    return;
  }
  await directus.request(createPermission({ policy, collection, action, fields, permissions, validation, presets: null }));
  console.log(`  + ${action} auf ${collection} angelegt`);
}

export async function removePublicPermission(collection, action) {
  const policy = await getPublicPolicyId();
  const existing = await directus.request(readPermissions({ filter: { policy: { _eq: policy }, collection: { _eq: collection }, action: { _eq: action } }, fields: ['id'] }));
  for (const p of existing) await directus.request(deletePermission(p.id));
  console.log(existing.length ? `  - Public-${action} auf ${collection} entfernt` : `  = kein Public-${action} auf ${collection}`);
}

export async function ensureAppUser(roleId, email, token) {
  const found = await directus.request(readUsers({ filter: { email: { _eq: email } }, fields: ['id'], limit: 1 }));
  if (found.length) {
    await directus.request(updateUser(found[0].id, { role: roleId, token, status: 'active' }));
    console.log(`  ~ App-User ${email} aktualisiert`);
    return found[0].id;
  }
  const user = await directus.request(createUser({ email, role: roleId, token, status: 'active', first_name: 'App', last_name: 'Server' }));
  console.log(`  + App-User ${email} angelegt`);
  return user.id;
}
```
`authHeaders` und `DIRECTUS_URL` sind in der Datei bereits definiert.

- [ ] **Step 2: Public-Create aus `setup-schema-jobs.mjs` entfernen**

Den Block `await ensurePublicCreate('applications', { … })` (inklusive `validation`) löschen und `ensurePublicCreate` aus dem Import entfernen. Das Entfernen der bereits existierenden Permission übernimmt das neue Skript (`removePublicPermission`).

- [ ] **Step 3: `scripts/setup-schema-portal.mjs`**

```js
// scripts/setup-schema-portal.mjs
// Teil 2: Portal-Nutzer, Login-Tokens, Seitenaufrufe, Zusatzfelder, Rolle „App“ mit Token. Idempotent. Aufruf: yarn directus:schema:portal
import { readFileSync, appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { ensureCollection, ensureField, ensureRelation, ensureRole, ensurePolicy, ensureRoleHasPolicy, ensurePermission, removePublicPermission, ensureAppUser } from './lib/directus-admin.mjs';
import { pkUuid, input, textarea, boolField, intField, dateField, select } from './lib/fields.mjs';

const uuidM2o = (field, template, note, extra = {}) => ({ field, type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', note, options: { template }, ...extra }, schema: {} });
const timestamp = (field, note, extra = {}) => ({ field, type: 'timestamp', meta: { interface: 'datetime', width: 'half', note, ...extra }, schema: {} });
const jsonTags = (field, note) => ({ field, type: 'json', meta: { interface: 'tags', width: 'full', note, options: { alphabetize: true, lowercase: true } }, schema: {} });

console.log('\n[1/5] Zusatzfelder');
await ensureField('employers', 'domains', jsonTags('domains', 'Hostnamen dieses Dienstes, kleingeschrieben, ohne Port (z. B. sonnenhof.pflege-jobs.de)'));
await ensureField('employers', 'notify_reminders', boolField('notify_reminders', 'Erinnerung nach 24 Stunden ohne Rückruf', true));
await ensureField('employers', 'report_email', input('report_email', 'Empfänger Monatsreport (sonst Bewerbungs-E-Mail)'));
await ensureField('employers', 'template_invite', textarea('template_invite', 'Vorlage Einladung. Platzhalter: {name} {stelle} {dienst} {ansprechperson} {telefon}'));
await ensureField('employers', 'template_reject', textarea('template_reject', 'Vorlage Absage. Gleiche Platzhalter'));
await ensureField('applications', 'email', input('email', 'E-Mail (optional)'));
await ensureField('applications', 'first_contact_at', timestamp('first_contact_at', 'Erster Statuswechsel weg von Neu', { readonly: true }));
await ensureField('applications', 'reminder_sent_at', timestamp('reminder_sent_at', 'Erinnerung verschickt', { readonly: true }));
await ensureField('applications', 'note', textarea('note', 'Interne Notiz des Dienstes'));

console.log('\n[2/5] Collections');
await ensureCollection('portal_users', {
  meta: { group: 'Recruiting', icon: 'person', note: 'Zugänge zum Kundenportal', display_template: '{{name}} ({{email}})', sort: 4 },
  schema: {},
  fields: [
    pkUuid,
    select('status', [['active', 'Aktiv'], ['disabled', 'Deaktiviert']], 'active', 'Status'),
    input('email', 'E-Mail, kleingeschrieben', { required: true, schema: { is_unique: true } }),
    input('name', 'Name', { required: true }),
    select('role', [['dienst', 'Pflegedienst'], ['rhowerk', 'Rhowerk']], 'dienst', 'Rolle'),
    uuidM2o('employer', '{{name}}', 'Pflegedienst (Pflicht bei Rolle Pflegedienst)'),
    timestamp('last_login', 'Letzter Login', { readonly: true }),
  ],
});
await ensureCollection('login_tokens', {
  meta: { group: 'Recruiting', icon: 'key', note: 'Magic-Link-Tokens (nur Hash)', hidden: true, sort: 5 },
  schema: {},
  fields: [
    pkUuid,
    uuidM2o('user', '{{email}}', 'Nutzer', { required: true }),
    input('token_hash', 'SHA-256 des Tokens', { required: true, schema: { is_unique: true } }),
    timestamp('expires_at', 'Gültig bis', { required: true }),
    timestamp('used_at', 'Benutzt am'),
    { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half' }, schema: {} },
  ],
});
await ensureCollection('job_views', {
  meta: { group: 'Recruiting', icon: 'visibility', note: 'Aufrufe pro Stelle, Quelle und Tag', hidden: true, sort: 6 },
  schema: {},
  fields: [
    pkUuid,
    uuidM2o('job', '{{title}}', 'Stelle', { required: true }),
    uuidM2o('employer', '{{name}}', 'Pflegedienst', { required: true }),
    select('source', [['google', 'Google'], ['wa', 'WhatsApp'], ['qr', 'QR-Aushang'], ['direct', 'Direkt']], 'direct', 'Quelle'),
    dateField('day', 'Tag', { required: true }),
    intField('count', 'Aufrufe', { required: true }),
  ],
});

console.log('\n[3/5] Relationen');
await ensureRelation({ collection: 'portal_users', field: 'employer', related_collection: 'employers', schema: { on_delete: 'SET NULL' } });
await ensureRelation({ collection: 'login_tokens', field: 'user', related_collection: 'portal_users', schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'job_views', field: 'job', related_collection: 'jobs', schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'job_views', field: 'employer', related_collection: 'employers', schema: { on_delete: 'CASCADE' } });

console.log('\n[4/5] Rechte');
await removePublicPermission('applications', 'create');
const roleId = await ensureRole('App');
const policyId = await ensurePolicy('App', { app_access: false });
await ensureRoleHasPolicy(roleId, policyId);
const EMPLOYER_PORTAL_FIELDS = ['name', 'legal_name', 'logo', 'color_primary', 'color_secondary', 'address_street', 'address_zip', 'address_city', 'phone', 'website', 'apply_email', 'apply_whatsapp', 'service_area', 'about', 'schedule_model', 'benefits', 'notify_reminders', 'report_email', 'template_invite', 'template_reject'];
await ensurePermission(policyId, 'employers', 'read');
await ensurePermission(policyId, 'employers', 'update', { fields: EMPLOYER_PORTAL_FIELDS });
await ensurePermission(policyId, 'jobs', 'read');
await ensurePermission(policyId, 'jobs', 'create');
await ensurePermission(policyId, 'jobs', 'update');
await ensurePermission(policyId, 'applications', 'read');
await ensurePermission(policyId, 'applications', 'create');
await ensurePermission(policyId, 'applications', 'update', { fields: ['status', 'note', 'first_contact_at', 'reminder_sent_at'] });
await ensurePermission(policyId, 'job_views', 'read');
await ensurePermission(policyId, 'job_views', 'create');
await ensurePermission(policyId, 'job_views', 'update', { fields: ['count'] });
await ensurePermission(policyId, 'portal_users', 'read');
await ensurePermission(policyId, 'portal_users', 'update', { fields: ['last_login'] });
await ensurePermission(policyId, 'login_tokens', 'read');
await ensurePermission(policyId, 'login_tokens', 'create');
await ensurePermission(policyId, 'login_tokens', 'update', { fields: ['used_at'] });
await ensurePermission(policyId, 'login_tokens', 'delete');
await ensurePermission(policyId, 'directus_files', 'read');
await ensurePermission(policyId, 'directus_files', 'create');

console.log('\n[5/5] App-User und Token');
let token = process.env.DIRECTUS_APP_TOKEN;
if (!token) {
  token = randomBytes(32).toString('base64url');
  appendFileSync('.env', `\nDIRECTUS_APP_TOKEN=${token}\n`);
  console.log('  + DIRECTUS_APP_TOKEN erzeugt und in .env eingetragen');
}
await ensureAppUser(roleId, 'app@pflege-jobs.local', token);
console.log('\nFertig.\n');
```
`package.json`: `"directus:schema:portal": "node scripts/setup-schema-portal.mjs"`. Falls `.env` schon `DIRECTUS_APP_TOKEN=` (leer) enthält, die Zeile vor dem Lauf entfernen oder das Skript so anpassen, dass es eine leere Zeile ersetzt statt anzuhängen (bevorzugt: `readFileSync('.env')`, Zeile `DIRECTUS_APP_TOKEN=` per Regex ersetzen, sonst anhängen).

- [ ] **Step 4: Laufen lassen und prüfen**

```bash
yarn directus:schema:portal && yarn directus:schema:portal
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8055/items/applications -H "Content-Type: application/json" -d '{"name":"x"}'
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8055/items/portal_users"
```
Erwartet: zweiter Lauf nur `=`/`~`; anonymer POST auf applications → 403; anonymes GET portal_users → 403. Mit App-Token (aus `.env`, nicht ausgeben): `curl -s -o /dev/null -w "%{http_code}" http://localhost:8055/items/applications -H "Authorization: Bearer $TOKEN"` → 200.

- [ ] **Step 5: README und Commit**

README-Abschnitt „Start“ ergänzen: `yarn directus:schema:portal` nach `directus:schema:jobs`; erklärt, dass das Skript `DIRECTUS_APP_TOKEN` erzeugt.
```bash
git add scripts package.json README.md
git commit -m "Schema Teil 2: Portal-Nutzer, Login-Tokens, Aufrufe, Rolle App, Public-Create entfernt

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Dienst per Hostname

**Files:**
- Create: `shared/utils/host.ts`, `server/middleware/employer.ts`, `server/api/employer.get.ts`, `app/pages/kein-dienst.vue`
- Modify: `app/composables/useEmployer.ts`, `app/composables/useJobs.ts`, `server/api/__sitemap__/pages.ts`, `scripts/seed-jobs.mjs`
- Test: `tests/unit/host.test.ts`

**Interfaces:**
- Produces: `normalizeHost(raw: string | undefined): string` (kleingeschrieben, ohne Port); `resolveEmployerByHost<T extends { slug: string; domains?: string[] | null }>(host: string, employers: T[], fallbackSlug?: string): T | null` (exakter Domain-Treffer; sonst bei `localhost`/`127.0.0.1` oder keinem Treffer der Dienst mit `fallbackSlug`, falls gesetzt).
- `event.context.employer: Employer | null` (gesetzt von der Middleware, Cache 5 min pro Host).
- `GET /api/employer` → `Employer` (öffentliche Felder) oder 404.
- `useEmployer()` liefert weiter `{ employer }`; `useJobs()`/`useJob()` filtern nach `employer: { id: { _eq } }`.

- [ ] **Step 1: Test**

```ts
// tests/unit/host.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeHost, resolveEmployerByHost } from '../../shared/utils/host.ts'

const a = { slug: 'sonnenhof', domains: ['sonnenhof.pflege-jobs.de', 'jobs.sonnenhof.de'] }
const b = { slug: 'awo-sued', domains: ['awo-sued.pflege-jobs.de'] }
const c = { slug: 'ohne', domains: null }

test('normalizeHost: klein, ohne Port, ohne Leerzeichen', () => {
  assert.equal(normalizeHost('Sonnenhof.Pflege-Jobs.de:3000'), 'sonnenhof.pflege-jobs.de')
  assert.equal(normalizeHost(' localhost:3000 '), 'localhost')
  assert.equal(normalizeHost(undefined), '')
})

test('findet Dienst über jede seiner Domains, unabhängig von Port und Schreibweise', () => {
  assert.equal(resolveEmployerByHost('Jobs.Sonnenhof.de:443', [a, b, c])?.slug, 'sonnenhof')
  assert.equal(resolveEmployerByHost('awo-sued.pflege-jobs.de', [a, b, c])?.slug, 'awo-sued')
})

test('localhost fällt auf fallbackSlug zurück, unbekannter Host ohne Fallback → null', () => {
  assert.equal(resolveEmployerByHost('localhost:3000', [a, b, c], 'awo-sued')?.slug, 'awo-sued')
  assert.equal(resolveEmployerByHost('fremd.example', [a, b, c]), null)
  assert.equal(resolveEmployerByHost('fremd.example', [a, b, c], 'sonnenhof')?.slug, 'sonnenhof')
  assert.equal(resolveEmployerByHost('localhost', [a, b, c], 'gibt-es-nicht'), null)
})
```

- [ ] **Step 2: Test rot**

Run: `yarn test`
Expected: FAIL „Cannot find module … host.ts“

- [ ] **Step 3: `host.ts`**

```ts
// shared/utils/host.ts
// Dienst anhand des Hostnamens finden. Reine Funktion; die Middleware liefert die Dienste.
export function normalizeHost(raw: string | undefined): string {
  return (raw || '').trim().toLowerCase().replace(/:\d+$/, '')
}

export function resolveEmployerByHost<T extends { slug: string; domains?: string[] | null }>(host: string, employers: T[], fallbackSlug?: string): T | null {
  const h = normalizeHost(host)
  const byDomain = employers.find((e) => (e.domains ?? []).some((d) => normalizeHost(d) === h))
  if (byDomain) return byDomain
  if (fallbackSlug) return employers.find((e) => e.slug === fallbackSlug) ?? null
  return null
}
```

- [ ] **Step 4: Test grün**

Run: `yarn test`
Expected: PASS

- [ ] **Step 5: Middleware, Route, Composables, Sitemap**

```ts
// server/middleware/employer.ts
// Löst den Dienst dieser Anfrage am Hostnamen auf und legt ihn in event.context.employer ab (Cache 5 Minuten).
import type { Employer } from '#shared/utils/jobs'
import { normalizeHost, resolveEmployerByHost } from '#shared/utils/host'

const CACHE_MS = 5 * 60 * 1000
const FIELDS = '*,logo.id,logo.title'
let cache: { at: number; employers: Employer[] } | null = null

async function loadEmployers(directusUrl: string): Promise<Employer[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.employers
  const res = await $fetch<{ data: Employer[] }>(`${directusUrl}/items/employers`, {
    query: { fields: FIELDS, filter: { status: { _eq: 'published' } }, limit: -1 }, timeout: 5000,
  })
  cache = { at: Date.now(), employers: res.data ?? [] }
  return cache.employers
}

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt') || path.startsWith('/api/_') || path.startsWith('/favicon')) return
  const { public: pub } = useRuntimeConfig(event)
  if (!pub.directusUrl) { event.context.employer = null; return }
  try {
    const employers = await loadEmployers(pub.directusUrl as string)
    event.context.employer = resolveEmployerByHost(normalizeHost(getRequestHost(event)), employers, pub.employerSlug as string | undefined)
  } catch (err: unknown) {
    console.error('[employer] Dienste konnten nicht geladen werden:', err instanceof Error ? err.message : err)
    event.context.employer = null
    event.context.employerError = true
  }
})
```

```ts
// server/api/employer.get.ts
// Dienst der aktuellen Domain, für die öffentlichen Seiten.
export default defineEventHandler((event) => {
  if (event.context.employerError) throw createError({ statusCode: 503, statusMessage: 'Dienst gerade nicht erreichbar' })
  const employer = event.context.employer
  if (!employer) throw createError({ statusCode: 404, statusMessage: 'Kein Dienst für diese Adresse' })
  return employer
})
```

`app/composables/useEmployer.ts` ersetzen:
```ts
// Der Dienst dieser Domain (Server-Middleware löst den Host auf). Einmal laden, überall nutzen; setzt Farb-Tokens auf <html>.
import type { Employer } from '#shared/utils/jobs'

export async function useEmployer() {
  const employer = useState<Employer | null>('employer', () => null)
  useHead(() => ({
    htmlAttrs: {
      style: employer.value?.color_primary
        ? `--primary:${employer.value.color_primary};--secondary:${employer.value.color_secondary || ''}`
        : undefined,
    },
  }))
  if (!employer.value) {
    const headers = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host']) : undefined
    try {
      employer.value = await $fetch<Employer>('/api/employer', { headers })
    } catch (err: any) {
      if (err?.statusCode === 404) {
        await navigateTo('/kein-dienst')
        return { employer }
      }
      throw createError({ statusCode: 503, statusMessage: 'Dienst gerade nicht erreichbar', fatal: true })
    }
  }
  return { employer }
}
```

`app/composables/useJobs.ts`: `baseFilter` nimmt `employerId: string` und filtert `employer: { id: { _eq: employerId } }`. `useJobs()` und `useJob(slug)` holen zuerst `const { employer } = await useEmployer()` und übergeben `employer.value!.id`; wenn `employer.value` null ist, liefern sie leere Daten. `pub.employerSlug` wird dort nicht mehr gelesen.

`server/api/__sitemap__/pages.ts`: statt `employerSlug` den Dienst aus `event.context.employer` nehmen; ohne Dienst nur die CMS-Seiten liefern. Filter `employer: { id: { _eq: employer.id } }`.

```vue
<!-- app/pages/kein-dienst.vue -->
<template>
  <div class="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 class="text-2xl font-bold">Kein Dienst für diese Adresse</h1>
    <p class="mt-3 text-muted-foreground">Unter dieser Adresse ist noch kein Pflegedienst eingerichtet.</p>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'bare' })
useSeoMeta({ title: 'Kein Dienst', robots: 'noindex' })
</script>
```

`scripts/seed-jobs.mjs`: beim Demo-Dienst `domains: ['sonnenhof.localhost']` ergänzen (Browser lösen `*.localhost` lokal auf).

- [ ] **Step 6: Prüfen**

```bash
yarn dev
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/jobs
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: sonnenhof.localhost:3000" http://localhost:3000/jobs/pflegefachkraft
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: fremd.example" http://localhost:3000/api/employer
```
Erwartet: 200 (Fallback über `EMPLOYER_SLUG`), 200 (Domain-Treffer), 404. `yarn test` grün. Dev-Server beenden.

- [ ] **Step 7: Commit**

```bash
git add shared/utils/host.ts tests/unit/host.test.ts server/middleware/employer.ts server/api/employer.get.ts app/pages/kein-dienst.vue app/composables scripts/seed-jobs.mjs server/api/__sitemap__/pages.ts
git commit -m "Dienst per Hostname auflösen, EMPLOYER_SLUG nur noch als Fallback

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Bewerbung über App-Token, optionales E-Mail-Feld

**Files:**
- Modify: `server/api/apply.post.ts`, `shared/utils/applicationSchema.ts`, `app/components/jobs/ApplyForm.vue`, `server/utils/notify.ts`
- Test: `tests/unit/applicationSchema.test.ts` (ergänzen)

**Interfaces:**
- `applicationSchema` bekommt `email: z.string().trim().email('Bitte eine gültige E-Mail-Adresse angeben.').max(200).optional().or(z.literal(''))` mit Default `''`.
- `/api/apply` schreibt über `appFetch('/items/applications', { method: 'POST', body })`, prüft zusätzlich `job.employer.id === event.context.employer?.id` (sonst 404), speichert `email`.
- `renderApplicationMail` zeigt die E-Mail, wenn vorhanden.

- [ ] **Step 1: Test ergänzen**

```ts
test('E-Mail optional, aber wenn gesetzt gültig', () => {
  assert.equal(applicationSchema.safeParse({ ...ok, email: '' }).success, true)
  assert.equal(applicationSchema.safeParse({ ...ok, email: 'anna@example.com' }).success, true)
  assert.equal(applicationSchema.safeParse({ ...ok, email: 'keine-mail' }).success, false)
  const r = applicationSchema.safeParse(ok)
  if (r.success) assert.equal(r.data.email, '')
})
```

- [ ] **Step 2: Test rot, dann Schema**

Run: `yarn test` → FAIL (email wird nicht validiert / Default fehlt). Im Schema ergänzen:
```ts
email: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.union([z.literal(''), z.string().email('Bitte eine gültige E-Mail-Adresse angeben.').max(200)])).default(''),
```
Run: `yarn test` → PASS.

- [ ] **Step 3: Route, Formular, Mail**

In `server/api/apply.post.ts`:
- Import `appFetch, appItems` aus `../utils/directus`.
- Stelle laden über `appItems<Job & { employer: Employer }>('jobs', { filter: { id: { _eq: input.job } }, fields: '…wie bisher…', limit: 1 })`; der bisherige `try/catch` mit 503 bleibt (appItems wirft bereits `createError(503)` bei Netzwerkfehler, der Block kann vereinfacht werden).
- Nach der Sichtbarkeitsprüfung: `const hostEmployer = event.context.employer; if (hostEmployer && job.employer.id !== hostEmployer.id) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar' })`.
- `record` um `email: input.email` ergänzen; Speichern über `appFetch('/items/applications', { method: 'POST', body: record })`.
- `renderApplicationMail` bekommt `email: input.email`.

In `ApplyForm.vue`: Feld nach Telefon:
```vue
<div class="grid gap-1">
  <label for="apply-email" class="font-semibold">Deine E-Mail <span class="font-normal text-muted-foreground">(optional)</span></label>
  <input id="apply-email" v-model="form.email" type="email" autocomplete="email" inputmode="email" class="h-12 rounded-lg border border-border px-4 text-base">
  <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
</div>
```
und `email: ''` im `form`-Objekt.

In `notify.ts`: `ApplicationMailInput` um `email?: string` erweitern; in `text` und `html` eine Zeile „E-Mail: …“ nur, wenn gesetzt (HTML als `mailto:`-Link).

- [ ] **Step 4: Prüfen**

Dev-Server starten; POST `/api/apply` mit gültigen Daten inkl. `email` → `{ ok: true, previewId }`; in Directus (App-Token) steht die Bewerbung mit E-Mail; anonymer POST direkt auf `/items/applications` → 403. Test-Bewerbung wieder löschen (Admin-Token). `yarn test` grün. Dev-Server beenden.

- [ ] **Step 5: Commit**

```bash
git add server/api/apply.post.ts shared/utils/applicationSchema.ts app/components/jobs/ApplyForm.vue server/utils/notify.ts tests/unit/applicationSchema.test.ts
git commit -m "Bewerbung über App-Token speichern, optionales E-Mail-Feld

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Seitenaufrufe zählen

**Files:**
- Create: `shared/utils/track.ts`, `server/api/track.post.ts`
- Modify: `app/pages/jobs/[slug]/index.vue`
- Test: `tests/unit/track.test.ts`

**Interfaces:**
- `isBot(userAgent: string | undefined): boolean`; `trackSource(raw: unknown): 'google' | 'wa' | 'qr' | 'direct'` (nur bekannte Quellen, `demo` → `direct`).
- `POST /api/track` `{ job: uuid, source }` → `{ ok: true }`; erhöht `job_views.count` für (job, source, heute).

- [ ] **Step 1: Test**

```ts
// tests/unit/track.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isBot, trackSource } from '../../shared/utils/track.ts'

test('erkennt Bots an typischen Kennungen, normale Browser nicht', () => {
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true)
  assert.equal(isBot('facebookexternalhit/1.1'), true)
  assert.equal(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'), false)
  assert.equal(isBot(undefined), true)
})

test('trackSource kennt nur die vier Quellen', () => {
  assert.equal(trackSource('wa'), 'wa')
  assert.equal(trackSource('qr'), 'qr')
  assert.equal(trackSource('google'), 'google')
  assert.equal(trackSource('demo'), 'direct')
  assert.equal(trackSource(undefined), 'direct')
})
```

- [ ] **Step 2: Test rot, Implementierung, Test grün**

```ts
// shared/utils/track.ts
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse/i
export function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) return true
  return BOT_RE.test(userAgent)
}
export const TRACK_SOURCES = ['google', 'wa', 'qr', 'direct'] as const
export type TrackSource = typeof TRACK_SOURCES[number]
export function trackSource(raw: unknown): TrackSource {
  return (TRACK_SOURCES as readonly string[]).includes(String(raw)) ? (raw as TrackSource) : 'direct'
}
```
Run: `yarn test` → PASS.

- [ ] **Step 3: Route und Aufruf**

```ts
// server/api/track.post.ts
// Zählt einen Aufruf der Stellenseite pro Stelle, Quelle und Tag. Keine Cookies, keine IPs.
import { isBot, trackSource } from '#shared/utils/track'
import { toIsoDate } from '#shared/utils/jobs'
import { appFetch, appItems } from '../utils/directus'

export default defineEventHandler(async (event) => {
  if (isBot(getHeader(event, 'user-agent'))) return { ok: true }
  const body = await readBody(event).catch(() => ({}))
  const job = String(body?.job || '')
  if (!/^[0-9a-f-]{36}$/.test(job)) return { ok: true }
  const employer = event.context.employer
  if (!employer) return { ok: true }
  const source = trackSource(body?.source)
  const day = toIsoDate(new Date())
  try {
    const rows = await appItems<{ id: string; count: number }>('job_views', { filter: { job: { _eq: job }, employer: { _eq: employer.id }, source: { _eq: source }, day: { _eq: day } }, fields: 'id,count', limit: 1 })
    if (rows[0]) await appFetch(`/items/job_views/${rows[0].id}`, { method: 'PATCH', body: { count: (rows[0].count || 0) + 1 } })
    else await appFetch('/items/job_views', { method: 'POST', body: { job, employer: employer.id, source, day, count: 1 } })
  } catch (err: unknown) {
    console.warn('[track] nicht gezählt:', err instanceof Error ? err.message : err)
  }
  return { ok: true }
})
```
In `app/pages/jobs/[slug]/index.vue` im `<script setup>`:
```ts
onMounted(() => {
  if (!job.value) return
  const src = String(route.query.src ?? '')
  $fetch('/api/track', { method: 'POST', body: { job: job.value.id, source: src || (document.referrer.includes('google.') ? 'google' : 'direct') } }).catch(() => {})
})
```

- [ ] **Step 4: Prüfen und Commit**

Dev-Server: `/jobs/pflegefachkraft?src=qr` zweimal aufrufen (Browser oder curl mit Browser-User-Agent plus manuellem POST auf `/api/track`), dann mit App-Token `job_views` lesen: ein Datensatz, `count = 2`. Dev-Server beenden.
```bash
git add shared/utils/track.ts tests/unit/track.test.ts server/api/track.post.ts "app/pages/jobs/[slug]/index.vue"
git commit -m "Seitenaufrufe pro Stelle, Quelle und Tag zählen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Magic-Link-Login, Session, Portal-Layout

**Files:**
- Create: `shared/utils/auth.ts`, `server/utils/session.ts`, `server/api/auth/request-link.post.ts`, `server/api/auth/consume.post.ts`, `server/api/auth/logout.post.ts`, `app/middleware/portal.ts`, `app/layouts/portal.vue`, `app/pages/portal/login.vue`, `app/pages/portal/index.vue` (vorläufig), `scripts/seed-portal.mjs`
- Modify: `server/utils/notify.ts` (Login-Mail), `package.json`
- Test: `tests/unit/auth.test.ts`

**Interfaces:**
- `createLoginToken(): { token: string; hash: string }`, `hashToken(token: string): string` (SHA-256 hex), `isTokenUsable(row: { expires_at: string; used_at: string | null }, now?: Date): boolean`, `tokenExpiry(now?: Date): string` (ISO, +15 min).
- Session-Inhalt (`setUserSession(event, { user })`): `{ id, name, email, role: 'dienst' | 'rhowerk', employerId: string | null }`.
- `requirePortalUser(event): Promise<{ user: SessionUser; employer: Employer }>`; bei `rhowerk` Dienst aus `?employer=<id>` sonst Host-Dienst; bei `dienst` prüft Host-Bindung (Host-Dienst muss gleich sein oder Host ist `localhost`-Fallback).
- `renderLoginMail({ name, link, minutes })` in `notify.ts`; `sendMail(to, { subject, text, html })` als gemeinsame Versandfunktion (aus `notifyApplication` herausgezogen, `notifyApplication` ruft sie).

- [ ] **Step 1: Test**

```ts
// tests/unit/auth.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLoginToken, hashToken, isTokenUsable, tokenExpiry } from '../../shared/utils/auth.ts'

test('Token ist base64url mit 43 Zeichen, Hash ist SHA-256 hex und reproduzierbar', () => {
  const { token, hash } = createLoginToken()
  assert.match(token, /^[A-Za-z0-9_-]{43}$/)
  assert.match(hash, /^[0-9a-f]{64}$/)
  assert.equal(hashToken(token), hash)
  assert.notEqual(createLoginToken().token, token)
})

test('isTokenUsable: nur unbenutzt und nicht abgelaufen', () => {
  const now = new Date('2026-10-02T12:00:00Z')
  assert.equal(isTokenUsable({ expires_at: '2026-10-02T12:10:00Z', used_at: null }, now), true)
  assert.equal(isTokenUsable({ expires_at: '2026-10-02T11:59:59Z', used_at: null }, now), false)
  assert.equal(isTokenUsable({ expires_at: '2026-10-02T12:10:00Z', used_at: '2026-10-02T11:50:00Z' }, now), false)
})

test('tokenExpiry liegt 15 Minuten in der Zukunft', () => {
  const now = new Date('2026-10-02T12:00:00Z')
  assert.equal(tokenExpiry(now), '2026-10-02T12:15:00.000Z')
})
```

- [ ] **Step 2: Test rot, Implementierung, grün**

```ts
// shared/utils/auth.ts
// Magic-Link-Tokens: Klartext nur im Link, in der Datenbank nur der Hash.
import { randomBytes, createHash } from 'node:crypto'

export const TOKEN_MINUTES = 15

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
export function createLoginToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashToken(token) }
}
export function tokenExpiry(now: Date = new Date()): string {
  return new Date(now.getTime() + TOKEN_MINUTES * 60 * 1000).toISOString()
}
export function isTokenUsable(row: { expires_at: string; used_at: string | null }, now: Date = new Date()): boolean {
  if (row.used_at) return false
  return new Date(row.expires_at).getTime() > now.getTime()
}
```
Run: `yarn test` → PASS. (Die Datei nutzt `node:crypto`; sie wird nur serverseitig importiert.)

- [ ] **Step 3: Session-Helfer und Auth-Routen**

```ts
// server/utils/session.ts
import type { Employer } from '#shared/utils/jobs'
import { normalizeHost } from '#shared/utils/host'
import { appItems } from './directus'

export interface SessionUser { id: string; name: string; email: string; role: 'dienst' | 'rhowerk'; employerId: string | null }

export async function requirePortalUser(event: any): Promise<{ user: SessionUser; employer: Employer }> {
  const session = await getUserSession(event)
  const user = session?.user as SessionUser | undefined
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Bitte anmelden' })

  const hostEmployer = event.context.employer as Employer | null
  let employerId: string | null
  if (user.role === 'rhowerk') {
    employerId = (getQuery(event).employer as string) || hostEmployer?.id || null
  } else {
    employerId = user.employerId
    const host = normalizeHost(getRequestHost(event))
    const isLocal = host === 'localhost' || host === '127.0.0.1'
    if (!isLocal && hostEmployer && hostEmployer.id !== employerId) {
      throw createError({ statusCode: 403, statusMessage: 'Dieses Portal gehört zu einem anderen Dienst' })
    }
  }
  if (!employerId) throw createError({ statusCode: 403, statusMessage: 'Kein Dienst zugeordnet' })
  const rows = await appItems<Employer>('employers', { filter: { id: { _eq: employerId } }, fields: '*,logo.id,logo.title', limit: 1 })
  if (!rows[0]) throw createError({ statusCode: 404, statusMessage: 'Dienst nicht gefunden' })
  return { user, employer: rows[0] }
}
```

```ts
// server/api/auth/request-link.post.ts
// Magic-Link anfordern. Antwortet immer ok, damit E-Mail-Adressen nicht erraten werden können.
import { createLoginToken, tokenExpiry, TOKEN_MINUTES } from '#shared/utils/auth'
import { appFetch, appItems } from '../../utils/directus'
import { createRateLimiter } from '../../utils/rateLimit'
import { renderLoginMail, sendMail } from '../../utils/notify'

const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 })

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: true }
  if (!limiter.check(email)) return { ok: true }

  const users = await appItems<{ id: string; name: string; status: string }>('portal_users', { filter: { email: { _eq: email }, status: { _eq: 'active' } }, fields: 'id,name,status', limit: 1 })
  const user = users[0]
  if (!user) return { ok: true }

  const { token, hash } = createLoginToken()
  await appFetch('/items/login_tokens', { method: 'POST', body: { user: user.id, token_hash: hash, expires_at: tokenExpiry() } })

  const config = useRuntimeConfig(event)
  const base = (config.portalBaseUrl as string) || `${getRequestProtocol(event)}://${getRequestHost(event)}`
  const link = `${base}/portal/login?token=${token}`
  const mail = renderLoginMail({ name: user.name, link, minutes: TOKEN_MINUTES })
  try {
    await sendMail(email, '', mail)
  } catch (err: unknown) {
    console.error('Login-Mail fehlgeschlagen:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 503, statusMessage: 'Mail konnte nicht gesendet werden, bitte später erneut versuchen' })
  }
  return { ok: true }
})
```

```ts
// server/api/auth/consume.post.ts
import { hashToken, isTokenUsable } from '#shared/utils/auth'
import { appFetch, appItems } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const token = String(body?.token || '')
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw createError({ statusCode: 400, statusMessage: 'Link ungültig oder abgelaufen' })
  const rows = await appItems<{ id: string; expires_at: string; used_at: string | null; user: { id: string; name: string; email: string; role: 'dienst' | 'rhowerk'; employer: string | null; status: string } }>('login_tokens', {
    filter: { token_hash: { _eq: hashToken(token) } }, fields: 'id,expires_at,used_at,user.id,user.name,user.email,user.role,user.employer,user.status', limit: 1,
  })
  const row = rows[0]
  if (!row || !isTokenUsable(row) || row.user.status !== 'active') throw createError({ statusCode: 400, statusMessage: 'Link ungültig oder abgelaufen' })
  await appFetch(`/items/login_tokens/${row.id}`, { method: 'PATCH', body: { used_at: new Date().toISOString() } })
  await appFetch(`/items/portal_users/${row.user.id}`, { method: 'PATCH', body: { last_login: new Date().toISOString() } })
  await setUserSession(event, { user: { id: row.user.id, name: row.user.name, email: row.user.email, role: row.user.role, employerId: row.user.employer } })
  return { ok: true }
})
```

```ts
// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => { await clearUserSession(event); return { ok: true } })
```

In `notify.ts`: `sendMail(to: string, bcc: string, mail: { subject; text; html })` aus `notifyApplication` herausziehen (gleiche Logik: SMTP oder Vorschau-Datei; gibt `{ sent, previewId }` zurück); `notifyApplication` ruft `sendMail`. Dazu:
```ts
export function renderLoginMail(i: { name: string; link: string; minutes: number }) {
  const subject = 'Ihr Anmeldelink für das Portal'
  const text = `Hallo ${i.name},\n\nhier ist Ihr Anmeldelink. Er gilt ${i.minutes} Minuten und nur einmal:\n${i.link}\n\nFalls Sie das nicht angefordert haben, ignorieren Sie diese Mail.`
  const html = `<!doctype html><html lang="de"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#15221d;padding:24px"><p>Hallo ${esc(i.name)},</p><p>hier ist Ihr Anmeldelink. Er gilt ${i.minutes} Minuten und nur einmal.</p><p><a href="${esc(i.link)}" style="display:inline-block;background:#1d6b57;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Jetzt anmelden</a></p><p style="color:#5a6b64;font-size:14px">Falls Sie das nicht angefordert haben, ignorieren Sie diese Mail.</p></body></html>`
  return { subject, text, html }
}
```

- [ ] **Step 4: Middleware, Layout, Login-Seite**

```ts
// app/middleware/portal.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/portal/login') return
  const { loggedIn, fetch } = useUserSession()
  if (!loggedIn.value) await fetch()
  if (!loggedIn.value) return navigateTo(`/portal/login?next=${encodeURIComponent(to.fullPath)}`)
})
```

```vue
<!-- app/layouts/portal.vue -->
<template>
  <div class="min-h-screen bg-background text-foreground md:grid md:grid-cols-[240px_1fr]">
    <aside class="border-b border-border bg-secondary/40 p-4 md:border-b-0 md:border-r md:min-h-screen">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Portal</p>
      <p class="mt-1 font-bold truncate">{{ me?.employer?.name ?? '…' }}</p>
      <select v-if="me?.user.role === 'rhowerk' && me.employers?.length" :value="me.employer?.id" class="mt-2 w-full h-10 rounded-lg border border-border bg-background px-2 text-sm" @change="switchEmployer(($event.target as HTMLSelectElement).value)">
        <option v-for="e in me.employers" :key="e.id" :value="e.id">{{ e.name }}</option>
      </select>
      <nav class="mt-4 grid gap-1 text-sm">
        <NuxtLink v-for="l in links" :key="l.to" :to="withEmployer(l.to)" class="rounded-lg px-3 py-2 hover:bg-secondary" active-class="bg-secondary font-semibold">{{ l.label }}</NuxtLink>
        <button type="button" class="mt-4 rounded-lg px-3 py-2 text-left text-muted-foreground hover:bg-secondary" @click="logout">Abmelden</button>
      </nav>
    </aside>
    <main class="p-4 md:p-8 min-w-0"><slot /></main>
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
const { data: me } = await useFetch('/api/portal/me', { query: computed(() => ({ employer: route.query.employer })) })
const links = [
  { to: '/portal', label: 'Übersicht' }, { to: '/portal/stellen', label: 'Stellen' },
  { to: '/portal/bewerbungen', label: 'Bewerbungen' }, { to: '/portal/profil', label: 'Profil' },
]
const withEmployer = (to: string) => (route.query.employer ? `${to}?employer=${route.query.employer}` : to)
function switchEmployer(id: string) { navigateTo({ path: route.path, query: { ...route.query, employer: id } }) }
async function logout() { await $fetch('/api/auth/logout', { method: 'POST' }); await useUserSession().clear(); navigateTo('/portal/login') }
</script>
```
(`/api/portal/me` entsteht in Task 7; bis dahin zeigt die Seitenleiste „…“.)

```vue
<!-- app/pages/portal/login.vue -->
<template>
  <div class="mx-auto max-w-md px-4 py-16 grid gap-6">
    <h1 class="text-2xl font-bold">Anmelden</h1>
    <p v-if="state === 'consuming'" class="text-muted-foreground">Link wird geprüft …</p>
    <p v-else-if="state === 'error'" class="rounded-lg bg-destructive/10 p-3 text-destructive">Link ungültig oder abgelaufen. Bitte neuen Link anfordern.</p>
    <p v-if="state === 'sent'" class="rounded-lg bg-secondary p-4" role="status">Wenn die Adresse bekannt ist, haben wir einen Link geschickt. Er gilt 15 Minuten.
      <a v-if="previewId" :href="`/__mail/${previewId}`" target="_blank" class="block mt-2 text-sm underline">Mailvorschau öffnen (nur Entwicklung)</a></p>
    <form v-if="state !== 'sent' && state !== 'consuming'" class="grid gap-3" @submit.prevent="request">
      <label for="login-email" class="font-semibold">Ihre E-Mail-Adresse</label>
      <input id="login-email" v-model="email" type="email" required autocomplete="email" class="h-12 rounded-lg border border-border px-4 text-base">
      <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>
      <button type="submit" :disabled="busy" class="h-12 rounded-full bg-primary font-bold text-primary-foreground disabled:opacity-60">Link senden</button>
    </form>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'bare' })
const route = useRoute()
const email = ref('')
const busy = ref(false)
const formError = ref('')
const previewId = ref<string | null>(null)
const state = ref<'idle' | 'sent' | 'consuming' | 'error'>(route.query.token ? 'consuming' : 'idle')

onMounted(async () => {
  const token = route.query.token
  if (!token) return
  try {
    await $fetch('/api/auth/consume', { method: 'POST', body: { token } })
    await useUserSession().fetch()
    navigateTo(String(route.query.next || '/portal'))
  } catch { state.value = 'error' }
})
async function request() {
  busy.value = true; formError.value = ''
  try {
    const res = await $fetch<{ ok: boolean; previewId?: string }>('/api/auth/request-link', { method: 'POST', body: { email: email.value } })
    previewId.value = res.previewId ?? null
    state.value = 'sent'
  } catch (err: any) {
    formError.value = err?.statusCode === 503 ? 'Mail konnte nicht gesendet werden, bitte später erneut versuchen.' : 'Gerade nicht möglich.'
  } finally { busy.value = false }
}
useSeoMeta({ title: 'Anmelden', robots: 'noindex' })
</script>
```
Damit die Login-Seite im Dev-Modus die Mailvorschau zeigt, gibt `request-link` im Dev-Modus `previewId` aus `sendMail` zurück (`{ ok: true, ...(import.meta.dev && previewId ? { previewId } : {}) }`).

Vorläufige `app/pages/portal/index.vue`:
```vue
<template><h1 class="text-2xl font-bold">Übersicht</h1></template>
<script setup lang="ts">definePageMeta({ layout: 'portal', middleware: 'portal' })</script>
```

- [ ] **Step 5: Seed für Portal-Nutzer**

```js
// scripts/seed-portal.mjs
// Zwei Portal-Nutzer: ein Rhowerk-Admin (NOTIFY_BCC oder admin@example.com) und ein Dienst-Nutzer für den Demo-Dienst. Idempotent per E-Mail.
import { upsertItem, directus } from './lib/directus-admin.mjs';
import { readItems } from '@directus/sdk';
const admin = (process.env.NOTIFY_BCC || 'admin@example.com').toLowerCase();
const [demo] = await directus.request(readItems('employers', { filter: { slug: { _eq: 'sonnenhof-leipzig' } }, fields: ['id'], limit: 1 }));
await upsertItem('portal_users', { email: admin }, { status: 'active', email: admin, name: 'Rhowerk', role: 'rhowerk', employer: null }, admin);
if (demo) await upsertItem('portal_users', { email: 'pdl@sonnenhof.example' }, { status: 'active', email: 'pdl@sonnenhof.example', name: 'Frau Beispiel', role: 'dienst', employer: demo.id }, 'pdl@sonnenhof.example');
console.log('Fertig.');
```
`package.json`: `"directus:seed:portal": "node scripts/seed-portal.mjs"`. Prüfen, ob `upsertItem` die ID oder das Item liefert (siehe Task 7 in Teil 1) – hier wird der Rückgabewert nicht genutzt.

- [ ] **Step 6: Prüfen**

```bash
yarn directus:seed:portal
yarn dev
```
Im Browser: `/portal` → Redirect auf `/portal/login`. E-Mail `pdl@sonnenhof.example` eingeben → „Link geschickt“ mit Mailvorschau-Link; Vorschau öffnen, Link klicken → landet auf `/portal` mit Layout. Link ein zweites Mal öffnen → „Link ungültig oder abgelaufen“. Abmelden → Login. `yarn test` grün. Dev-Server beenden.

- [ ] **Step 7: Commit**

```bash
git add shared/utils/auth.ts tests/unit/auth.test.ts server/utils/session.ts server/api/auth app/middleware/portal.ts app/layouts/portal.vue app/pages/portal server/utils/notify.ts scripts/seed-portal.mjs package.json
git commit -m "Portal-Login per Magic-Link, Session, Layout, Seed für Nutzer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Portal-Übersicht

**Files:**
- Create: `shared/utils/overview.ts`, `server/api/portal/me.get.ts`, `server/api/portal/overview.get.ts`
- Modify: `app/pages/portal/index.vue`
- Test: `tests/unit/overview.test.ts`

**Interfaces:**
- `aggregateOverview({ views, applications, jobs, monthStart }: { views: Array<{ day: string; count: number }>; applications: Array<{ status: string; date_created: string }>; jobs: Array<{ status: string; valid_through: string | null }>; monthStart: string }) → { views: number; applications: number; waiting: number; openJobs: number }`.
- `GET /api/portal/me` → `{ user, employer, employers?: Array<{ id; name }> }` (Liste nur bei `rhowerk`).
- `GET /api/portal/overview` → `{ month: 'YYYY-MM', stats, waiting: Application[] }`.

- [ ] **Step 1: Test**

```ts
// tests/unit/overview.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateOverview } from '../../shared/utils/overview.ts'

test('zählt nur den laufenden Monat, wartende = status neu, offene Stellen = published und gültig', () => {
  const r = aggregateOverview({
    monthStart: '2026-10-01',
    views: [{ day: '2026-10-02', count: 5 }, { day: '2026-09-30', count: 9 }],
    applications: [
      { status: 'neu', date_created: '2026-10-02T10:00:00Z' },
      { status: 'kontaktiert', date_created: '2026-10-01T10:00:00Z' },
      { status: 'neu', date_created: '2026-09-29T10:00:00Z' },
    ],
    jobs: [{ status: 'published', valid_through: '2026-12-01' }, { status: 'published', valid_through: '2026-09-01' }, { status: 'filled', valid_through: '2026-12-01' }],
    today: '2026-10-02',
  })
  assert.deepEqual(r, { views: 5, applications: 2, waiting: 2, openJobs: 1 })
})
```
(`waiting` zählt alle Bewerbungen mit `status = neu`, unabhängig vom Monat; `applications` nur die des Monats.)

- [ ] **Step 2: Test rot, Implementierung, grün**

```ts
// shared/utils/overview.ts
export interface OverviewInput {
  monthStart: string; today: string
  views: Array<{ day: string; count: number }>
  applications: Array<{ status: string; date_created: string }>
  jobs: Array<{ status: string; valid_through: string | null }>
}
export function aggregateOverview(i: OverviewInput) {
  const inMonth = (d: string) => d.slice(0, 10) >= i.monthStart
  return {
    views: i.views.filter((v) => inMonth(v.day)).reduce((s, v) => s + (v.count || 0), 0),
    applications: i.applications.filter((a) => inMonth(a.date_created)).length,
    waiting: i.applications.filter((a) => a.status === 'neu').length,
    openJobs: i.jobs.filter((j) => j.status === 'published' && !!j.valid_through && j.valid_through.slice(0, 10) >= i.today).length,
  }
}
```
Run: `yarn test` → PASS.

- [ ] **Step 3: Routen und Seite**

```ts
// server/api/portal/me.get.ts
import { requirePortalUser } from '../../utils/session'
import { appItems } from '../../utils/directus'
export default defineEventHandler(async (event) => {
  const { user, employer } = await requirePortalUser(event)
  const employers = user.role === 'rhowerk' ? await appItems<{ id: string; name: string }>('employers', { fields: 'id,name', sort: 'name' }) : undefined
  return { user, employer, employers }
})
```

```ts
// server/api/portal/overview.get.ts
import { toIsoDate } from '#shared/utils/jobs'
import { aggregateOverview } from '#shared/utils/overview'
import { requirePortalUser } from '../../utils/session'
import { appItems } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const now = new Date()
  const today = toIsoDate(now)
  const monthStart = `${today.slice(0, 7)}-01`
  const [views, applications, jobs, waiting] = await Promise.all([
    appItems('job_views', { filter: { employer: { _eq: employer.id }, day: { _gte: monthStart } }, fields: 'day,count' }),
    appItems('applications', { filter: { employer: { _eq: employer.id } }, fields: 'status,date_created' }),
    appItems('jobs', { filter: { employer: { _eq: employer.id } }, fields: 'status,valid_through' }),
    appItems('applications', { filter: { employer: { _eq: employer.id }, status: { _eq: 'neu' } }, fields: 'id,name,phone,qualification,hours_wish,date_created,job.title,job.slug', sort: 'date_created', limit: 50 }),
  ])
  return { month: today.slice(0, 7), stats: aggregateOverview({ monthStart, today, views, applications, jobs }), waiting }
})
```

`app/pages/portal/index.vue` ersetzen:
```vue
<template>
  <div class="grid gap-8">
    <h1 class="text-2xl font-bold">Übersicht {{ monthLabel }}</h1>
    <div v-if="error" class="rounded-xl border border-border p-4 text-muted-foreground">Gerade nicht erreichbar. Bitte in ein paar Minuten erneut laden.</div>
    <template v-else-if="data">
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="t in tiles" :key="t.label" class="rounded-xl border border-border p-4"><p class="text-3xl font-extrabold tabular-nums">{{ t.value }}</p><p class="text-sm text-muted-foreground">{{ t.label }}</p></li>
      </ul>
      <section class="grid gap-3">
        <h2 class="text-xl font-bold">Wartet auf Rückruf</h2>
        <p v-if="!data.waiting.length" class="text-muted-foreground">Alles erledigt. Keine offenen Bewerbungen.</p>
        <ul v-else class="grid gap-2">
          <li v-for="a in data.waiting" :key="a.id" class="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">
            <div class="min-w-0 flex-1"><p class="font-semibold">{{ a.name }} <span class="font-normal text-muted-foreground">· {{ QUALIFICATION_LABELS[a.qualification] ?? a.qualification }}</span></p><p class="text-sm text-muted-foreground">{{ a.job?.title }} · seit {{ since(a.date_created) }}</p></div>
            <a :href="`tel:${a.phone}`" class="h-10 inline-flex items-center rounded-full border border-border px-4 font-semibold">{{ a.phone }}</a>
            <button type="button" class="h-10 rounded-full bg-primary px-4 font-semibold text-primary-foreground" @click="contacted(a.id)">Kontaktiert</button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
<script setup lang="ts">
import { QUALIFICATION_LABELS } from '#shared/utils/jobs'
definePageMeta({ layout: 'portal', middleware: 'portal' })
const route = useRoute()
const { data, error, refresh } = await useFetch<any>('/api/portal/overview', { query: computed(() => ({ employer: route.query.employer })) })
const monthLabel = computed(() => data.value ? new Date(`${data.value.month}-01`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : '')
const tiles = computed(() => data.value ? [
  { label: 'Aufrufe', value: data.value.stats.views }, { label: 'Bewerbungen', value: data.value.stats.applications },
  { label: 'ohne Rückruf', value: data.value.stats.waiting }, { label: 'offene Stellen', value: data.value.stats.openJobs },
] : [])
const since = (iso: string) => { const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000); return h < 48 ? `${h} Std.` : `${Math.round(h / 24)} Tagen` }
async function contacted(id: string) {
  await $fetch(`/api/portal/applications/${id}`, { method: 'PATCH', body: { status: 'kontaktiert' }, query: { employer: route.query.employer } })
  await refresh()
}
</script>
```
(`PATCH /api/portal/applications/:id` entsteht in Task 9; der Knopf funktioniert ab dann.)

- [ ] **Step 4: Prüfen und Commit**

Login als `pdl@sonnenhof.example`, `/portal` zeigt vier Kacheln und die Liste (ggf. leer). Als Rhowerk-Nutzer: Dienst-Umschalter sichtbar. `yarn test` grün.
```bash
git add shared/utils/overview.ts tests/unit/overview.test.ts server/api/portal app/pages/portal/index.vue
git commit -m "Portal-Übersicht mit Monatszahlen und wartenden Bewerbungen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Stellen im Portal

**Files:**
- Create: `shared/utils/jobSchema.ts`, `server/api/portal/jobs/index.get.ts`, `server/api/portal/jobs/index.post.ts`, `server/api/portal/jobs/[id].get.ts`, `server/api/portal/jobs/[id].patch.ts`, `app/pages/portal/stellen/index.vue`, `app/pages/portal/stellen/neu.vue`, `app/pages/portal/stellen/[id].vue`, `app/components/portal/JobForm.vue`, `app/components/portal/ShareDialog.vue`
- Test: `tests/unit/jobSchema.test.ts`

**Interfaces:**
- `jobSchema` (zod): `title` (2–120), `slug` (`/^[a-z0-9-]{2,80}$/`), `status` (`published|draft|filled|expired`), `employment_types` (Array aus `EMPLOYMENT_TYPE_LABELS`-Keys, min 1), `hours_min/hours_max` (int 1–60, optional, min ≤ max), `start_note` (≤ 80), `salary_min/salary_max` (number ≥ 0, optional, min ≤ max), `salary_unit`, `salary_note` (≤ 200), `location_override` (null oder `{street, zip, city}` alle nicht leer), `intro` (≤ 600), `tasks`/`requirements` (HTML ≤ 5000), `contact_name` (≤ 120), `date_posted`/`valid_through` (`YYYY-MM-DD`, valid_through ≥ date_posted), `apply_email_override` (E-Mail oder leer). `slugify(title: string): string`.
- Routen filtern `employer: { _eq: employer.id }`; `POST` setzt `employer` serverseitig; `PATCH` lädt zuerst mit Filter und liefert 404 bei fremdem Dienst; Slug muss pro Dienst eindeutig sein (409 sonst).

- [ ] **Step 1: Test**

```ts
// tests/unit/jobSchema.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jobSchema, slugify } from '../../shared/utils/jobSchema.ts'

const ok = { title: 'Pflegefachkraft (m/w/d)', slug: 'pflegefachkraft', status: 'published', employment_types: ['FULL_TIME'], date_posted: '2026-10-01', valid_through: '2026-12-01', salary_unit: 'MONTH' }

test('slugify', () => {
  assert.equal(slugify('Pflegefachkraft (m/w/d) – Nachtdienst'), 'pflegefachkraft-m-w-d-nachtdienst')
  assert.equal(slugify('Ärztliche Leitung Süd'), 'aerztliche-leitung-sued')
})
test('gültige Stelle, Defaults für optionale Felder', () => {
  const r = jobSchema.safeParse(ok)
  assert.equal(r.success, true)
  if (r.success) { assert.equal(r.data.intro, ''); assert.equal(r.data.location_override, null) }
})
test('Stunden und Gehalt: min ≤ max, valid_through ≥ date_posted, Override nur komplett', () => {
  assert.equal(jobSchema.safeParse({ ...ok, hours_min: 30, hours_max: 20 }).success, false)
  assert.equal(jobSchema.safeParse({ ...ok, salary_min: 4000, salary_max: 3000 }).success, false)
  assert.equal(jobSchema.safeParse({ ...ok, valid_through: '2026-09-01' }).success, false)
  assert.equal(jobSchema.safeParse({ ...ok, location_override: { city: 'Leipzig' } }).success, false)
  assert.equal(jobSchema.safeParse({ ...ok, location_override: { street: 'A 1', zip: '04277', city: 'Leipzig' } }).success, true)
  assert.equal(jobSchema.safeParse({ ...ok, employment_types: [] }).success, false)
})
```

- [ ] **Step 2: Test rot, Implementierung, grün**

```ts
// shared/utils/jobSchema.ts
import { z } from 'zod'
import { EMPLOYMENT_TYPE_LABELS } from './jobs.ts'

export function slugify(s: string): string {
  return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum im Format JJJJ-MM-TT')
const optInt = z.preprocess((v) => (v === '' || v === null || v === undefined ? null : Number(v)), z.number().int().min(1).max(60).nullable())
const optNum = z.preprocess((v) => (v === '' || v === null || v === undefined ? null : Number(v)), z.number().min(0).max(100000).nullable())
const types = Object.keys(EMPLOYMENT_TYPE_LABELS) as [keyof typeof EMPLOYMENT_TYPE_LABELS, ...Array<keyof typeof EMPLOYMENT_TYPE_LABELS>]

export const jobSchema = z.object({
  title: z.string().trim().min(2, 'Bitte einen Titel angeben.').max(120),
  slug: z.string().regex(/^[a-z0-9-]{2,80}$/, 'Nur Kleinbuchstaben, Ziffern und Bindestriche.'),
  status: z.enum(['published', 'draft', 'filled', 'expired']),
  employment_types: z.array(z.enum(types)).min(1, 'Mindestens eine Beschäftigungsart wählen.'),
  hours_min: optInt.default(null), hours_max: optInt.default(null),
  start_note: z.string().trim().max(80).optional().default(''),
  salary_min: optNum.default(null), salary_max: optNum.default(null),
  salary_unit: z.enum(['MONTH', 'HOUR']).default('MONTH'),
  salary_note: z.string().trim().max(200).optional().default(''),
  location_override: z.union([z.null(), z.object({ street: z.string().trim().min(1), zip: z.string().trim().min(4), city: z.string().trim().min(1) })]).default(null),
  intro: z.string().trim().max(600).optional().default(''),
  tasks: z.string().max(5000).optional().default(''),
  requirements: z.string().max(5000).optional().default(''),
  contact_name: z.string().trim().max(120).optional().default(''),
  date_posted: date, valid_through: date,
  apply_email_override: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.union([z.literal(''), z.string().email()])).default(''),
}).superRefine((d, ctx) => {
  if (d.hours_min != null && d.hours_max != null && d.hours_min > d.hours_max) ctx.addIssue({ code: 'custom', path: ['hours_max'], message: 'Höchstens muss größer als mindestens sein.' })
  if (d.salary_min != null && d.salary_max != null && d.salary_min > d.salary_max) ctx.addIssue({ code: 'custom', path: ['salary_max'], message: 'Gehalt bis muss größer als Gehalt von sein.' })
  if (d.valid_through < d.date_posted) ctx.addIssue({ code: 'custom', path: ['valid_through'], message: 'Gültig bis muss nach dem Veröffentlichungsdatum liegen.' })
})
export type JobInput = z.infer<typeof jobSchema>
```
Run: `yarn test` → PASS.

- [ ] **Step 3: Routen**

```ts
// server/api/portal/jobs/index.get.ts
import { requirePortalUser } from '../../../utils/session'
import { appItems } from '../../../utils/directus'
import { toIsoDate } from '#shared/utils/jobs'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const since = toIsoDate(new Date(Date.now() - 30 * 86400000))
  const [jobs, apps, views] = await Promise.all([
    appItems('jobs', { filter: { employer: { _eq: employer.id } }, fields: 'id,title,slug,status,valid_through,date_posted', sort: '-date_posted' }),
    appItems('applications', { filter: { employer: { _eq: employer.id } }, fields: 'job' }),
    appItems('job_views', { filter: { employer: { _eq: employer.id }, day: { _gte: since } }, fields: 'job,count' }),
  ])
  const appCount: Record<string, number> = {}; for (const a of apps) appCount[a.job] = (appCount[a.job] || 0) + 1
  const viewCount: Record<string, number> = {}; for (const v of views) viewCount[v.job] = (viewCount[v.job] || 0) + (v.count || 0)
  return jobs.map((j: any) => ({ ...j, applications: appCount[j.id] || 0, views30: viewCount[j.id] || 0 }))
})
```

```ts
// server/api/portal/jobs/index.post.ts
import { jobSchema } from '#shared/utils/jobSchema'
import { requirePortalUser } from '../../../utils/session'
import { appFetch, appItems } from '../../../utils/directus'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const parsed = jobSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben', data: parsed.error.flatten().fieldErrors })
  const dup = await appItems('jobs', { filter: { employer: { _eq: employer.id }, slug: { _eq: parsed.data.slug } }, fields: 'id', limit: 1 })
  if (dup.length) throw createError({ statusCode: 409, statusMessage: 'Diesen URL-Namen gibt es schon.' })
  const res = await appFetch<{ data: { id: string } }>('/items/jobs', { method: 'POST', body: { ...parsed.data, employer: employer.id } })
  return { id: res.data.id }
})
```

```ts
// server/api/portal/jobs/[id].get.ts
import { requirePortalUser } from '../../../utils/session'
import { appItems } from '../../../utils/directus'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const id = getRouterParam(event, 'id') || ''
  const rows = await appItems('jobs', { filter: { id: { _eq: id }, employer: { _eq: employer.id } }, fields: '*', limit: 1 })
  if (!rows[0]) throw createError({ statusCode: 404, statusMessage: 'Stelle nicht gefunden' })
  return rows[0]
})
```

```ts
// server/api/portal/jobs/[id].patch.ts
import { jobSchema } from '#shared/utils/jobSchema'
import { requirePortalUser } from '../../../utils/session'
import { appFetch, appItems } from '../../../utils/directus'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const id = getRouterParam(event, 'id') || ''
  const existing = await appItems('jobs', { filter: { id: { _eq: id }, employer: { _eq: employer.id } }, fields: '*', limit: 1 })
  if (!existing[0]) throw createError({ statusCode: 404, statusMessage: 'Stelle nicht gefunden' })
  const body = await readBody(event)
  // Teil-Update (z. B. nur status) wird mit dem Bestand gemischt und dann komplett validiert
  const parsed = jobSchema.safeParse({ ...existing[0], ...body })
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben', data: parsed.error.flatten().fieldErrors })
  if (parsed.data.slug !== existing[0].slug) {
    const dup = await appItems('jobs', { filter: { employer: { _eq: employer.id }, slug: { _eq: parsed.data.slug }, id: { _neq: id } }, fields: 'id', limit: 1 })
    if (dup.length) throw createError({ statusCode: 409, statusMessage: 'Diesen URL-Namen gibt es schon.' })
  }
  await appFetch(`/items/jobs/${id}`, { method: 'PATCH', body: parsed.data })
  return { ok: true }
})
```

- [ ] **Step 4: Formular, Dialog, Seiten**

`app/components/portal/JobForm.vue`: Props `modelValue: Partial<JobInput>`, `employer: Employer`, `busy: boolean`, `errors: Record<string,string>`; Emits `submit(data)`. Felder in vier Gruppen (Grunddaten, Gehalt, Inhalt, Laufzeit) nach Spec; `tasks`/`requirements` als `<textarea>` mit Hinweis „Eine Zeile pro Punkt“, wird beim Speichern in `<ul><li>…</li></ul>` umgewandelt (Helfer `linesToList(text)` und `listToLines(html)` in `shared/utils/jobSchema.ts`, mit zwei Tests ergänzen: `linesToList('a\nb') === '<ul><li>a</li><li>b</li></ul>'`, `listToLines('<ul><li>a</li><li>b</li></ul>') === 'a\nb'`, HTML wird dabei escaped). Slug-Feld füllt sich aus dem Titel per `slugify`, solange der Nutzer es nicht geändert hat. Rechts (ab `lg`) eine Karte „Google-Markup“: `checkJobPosting(buildJobPosting({ job: previewJob, employer, siteUrl }))` live aus dem Formularstand, Pflichtfelder rot/grün, Empfehlungen gelb/grün, mit Klartext: Gehalt → „Stellen mit Gehalt werden häufiger angezeigt“, Logo → „Logo im Profil hinterlegen“.

`app/components/portal/ShareDialog.vue`: Props `job`, `employer`; nutzt `shareLinks` aus `#shared/utils/share` mit `siteUrl` = `https://<erste Domain des Dienstes>` (Fallback `runtimeConfig.public.siteUrl`); zeigt Link kopieren, WhatsApp, QR-Bild (`/api/qr/<slug>`), Link zum Aushang; shadcn `Dialog`.

`app/pages/portal/stellen/index.vue`: Tabelle (shadcn `Table`) mit Titel, Stand (Badge), gültig bis, Bewerbungen, Aufrufe 30 Tage; Aktionen Bearbeiten (Link), Vorschau (`/jobs/<slug>` neuer Tab), Teilen (öffnet ShareDialog), Schließen/Öffnen (`PATCH { status: 'filled' }` bzw. `{ status: 'published' }`, danach `refresh()`). Knopf „Neue Stelle“ → `/portal/stellen/neu`. Alle Links tragen `?employer=` weiter, wenn gesetzt.

`app/pages/portal/stellen/neu.vue`: JobForm mit Defaults (`status: 'draft'`, `date_posted: heute`, `valid_through: heute + 60`, `salary_unit: 'MONTH'`, `employment_types: ['FULL_TIME']`); Submit → `POST /api/portal/jobs` → `navigateTo('/portal/stellen/<id>')`; 422-Fehler in `errors`, 409 als `errors.slug`.

`app/pages/portal/stellen/[id].vue`: lädt `GET /api/portal/jobs/:id`, JobForm, Submit → `PATCH`; Erfolgsmeldung „Gespeichert“; Link „Auf der Website ansehen“, wenn `status = published`.

Alle drei Seiten: `definePageMeta({ layout: 'portal', middleware: 'portal' })`.

- [ ] **Step 5: Prüfen**

Login, `/portal/stellen` zeigt die zwei Demo-Stellen mit Zahlen. Neue Stelle anlegen mit Gehalt → erscheint unter `/jobs` (bei `status: published`). Slug doppelt → Fehler am Slug-Feld. Stelle schließen → verschwindet aus `/jobs`, Stellenseite 404. Als Rhowerk-Nutzer mit `?employer=<fremde-id>`: nur dessen Stellen. Direktes `PATCH /api/portal/jobs/<id eines anderen Dienstes>` als Dienst-Nutzer → 404 (Review-Focus 3 analog). `yarn test` grün, Typecheck ohne neue Fehler.

- [ ] **Step 6: Commit**

```bash
git add shared/utils/jobSchema.ts tests/unit/jobSchema.test.ts server/api/portal/jobs app/pages/portal/stellen app/components/portal
git commit -m "Stellen im Portal anlegen, bearbeiten, schließen, teilen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Bewerbungen im Portal

**Files:**
- Create: `shared/utils/templates.ts`, `server/api/portal/applications/index.get.ts`, `server/api/portal/applications/[id].patch.ts`, `app/pages/portal/bewerbungen.vue`, `app/components/portal/MessageDialog.vue`
- Test: `tests/unit/templates.test.ts`

**Interfaces:**
- `fillTemplate(template: string, vars: Record<string, string>): string` ersetzt `{name}` usw.; unbekannte Platzhalter bleiben stehen; `DEFAULT_TEMPLATE_INVITE`, `DEFAULT_TEMPLATE_REJECT` (Konstanten, genutzt, wenn der Dienst keine Vorlage hat).
- `applicationPatchSchema`: `{ status?: enum, note?: string ≤ 2000 }`, mindestens eines.
- `PATCH` setzt `first_contact_at`, wenn Bestand `neu` war und neuer Status ≠ `neu`.

- [ ] **Step 1: Test**

```ts
// tests/unit/templates.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fillTemplate, DEFAULT_TEMPLATE_INVITE } from '../../shared/utils/templates.ts'

test('ersetzt alle bekannten Platzhalter, mehrfach, lässt unbekannte stehen', () => {
  assert.equal(fillTemplate('Hallo {name}, {stelle} bei {dienst}. {name}! {unbekannt}', { name: 'Anna', stelle: 'PFK', dienst: 'Sonnenhof' }), 'Hallo Anna, PFK bei Sonnenhof. Anna! {unbekannt}')
})
test('Standardvorlage enthält Name, Stelle, Dienst und Ansprechperson', () => {
  for (const p of ['{name}', '{stelle}', '{dienst}', '{ansprechperson}']) assert.ok(DEFAULT_TEMPLATE_INVITE.includes(p), p)
})
```

- [ ] **Step 2: Test rot, Implementierung, grün**

```ts
// shared/utils/templates.ts
export const DEFAULT_TEMPLATE_INVITE = `Hallo {name},

vielen Dank für Ihre Bewerbung als {stelle} bei {dienst}. Wir würden Sie gern kennenlernen. Wann passt es Ihnen für ein kurzes Gespräch, gern auch telefonisch?

Herzliche Grüße
{ansprechperson}
{dienst} · {telefon}`

export const DEFAULT_TEMPLATE_REJECT = `Hallo {name},

vielen Dank für Ihre Bewerbung als {stelle} bei {dienst}. Wir haben uns für eine andere Bewerberin oder einen anderen Bewerber entschieden. Wir wünschen Ihnen für Ihren weiteren Weg alles Gute.

Herzliche Grüße
{ansprechperson}
{dienst}`

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m))
}
```
Run: `yarn test` → PASS.

- [ ] **Step 3: Routen**

```ts
// server/api/portal/applications/index.get.ts
import { requirePortalUser } from '../../../utils/session'
import { appItems } from '../../../utils/directus'
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const q = getQuery(event)
  const filter: any = { employer: { _eq: employer.id } }
  if (typeof q.status === 'string' && q.status) filter.status = { _eq: q.status }
  if (typeof q.job === 'string' && q.job) filter.job = { _eq: q.job }
  return appItems('applications', { filter, fields: 'id,status,name,phone,email,qualification,hours_wish,earliest_start,message,note,source,date_created,first_contact_at,job.id,job.title,job.slug,job.contact_name', sort: '-date_created', limit: 500 })
})
```

```ts
// server/api/portal/applications/[id].patch.ts
import { z } from 'zod'
import { requirePortalUser } from '../../../utils/session'
import { appFetch, appItems } from '../../../utils/directus'
const schema = z.object({ status: z.enum(['neu', 'kontaktiert', 'gespraech', 'zusage', 'absage']).optional(), note: z.string().max(2000).optional() }).refine((d) => d.status !== undefined || d.note !== undefined, 'Nichts zu ändern')
export default defineEventHandler(async (event) => {
  const { employer } = await requirePortalUser(event)
  const id = getRouterParam(event, 'id') || ''
  const rows = await appItems('applications', { filter: { id: { _eq: id }, employer: { _eq: employer.id } }, fields: 'id,status,first_contact_at', limit: 1 })
  if (!rows[0]) throw createError({ statusCode: 404, statusMessage: 'Bewerbung nicht gefunden' })
  const parsed = schema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben' })
  const body: any = { ...parsed.data }
  if (parsed.data.status && rows[0].status === 'neu' && parsed.data.status !== 'neu' && !rows[0].first_contact_at) body.first_contact_at = new Date().toISOString()
  await appFetch(`/items/applications/${id}`, { method: 'PATCH', body })
  return { ok: true }
})
```

- [ ] **Step 4: Seite und Dialog**

`app/components/portal/MessageDialog.vue`: Props `kind: 'invite' | 'reject'`, `application`, `employer`; baut Text mit `fillTemplate(employer.template_invite || DEFAULT_TEMPLATE_INVITE, { name, stelle: application.job.title, dienst: employer.name, ansprechperson: application.job.contact_name || '', telefon: employer.phone || '' })`; zeigt den Text in einem editierbaren `<textarea>`; Knöpfe: „Per WhatsApp“ (`https://wa.me/<normalizePhone(phone) ohne +>?text=<encodeURIComponent>`), „Als E-Mail“ (`mailto:<email>?subject=…&body=…`, nur wenn `application.email`), „Text kopieren“ (Clipboard mit Fallback). Hinweis unter dem Text: „Sie versenden die Nachricht selbst. Das Portal verschickt nichts an Bewerber.“

`app/pages/portal/bewerbungen.vue`: Filterleiste (Stand als Select mit „Alle“, Stelle als Select aus `/api/portal/jobs`), Liste wie in der Spec; Stand als `<select>` pro Zeile → `PATCH`; Aufklappbereich (shadcn `Collapsible`) mit Nachricht, frühester Start, Notiz (`<textarea>` mit „Notiz speichern“ → `PATCH { note }`), Knöpfe „Einladung“ und „Absage“ (öffnen MessageDialog). Default-Filter: Stand „Neu“. `definePageMeta({ layout: 'portal', middleware: 'portal' })`.

- [ ] **Step 5: Prüfen und Commit**

Über die Stellenseite eine Bewerbung absenden; im Portal unter „Neu“ sichtbar; Stand auf „Kontaktiert“ → verschwindet aus dem Neu-Filter, `first_contact_at` in Directus gesetzt; Einladung öffnet Dialog mit gefülltem Text. Als Dienst-Nutzer `PATCH` auf eine Bewerbung eines anderen Dienstes (per curl mit Session-Cookie oder zweitem Demo-Dienst) → 404. `yarn test` grün.
```bash
git add shared/utils/templates.ts tests/unit/templates.test.ts server/api/portal/applications app/pages/portal/bewerbungen.vue app/components/portal/MessageDialog.vue
git commit -m "Bewerbungen im Portal: Liste, Status, Notiz, Vorlagen für Einladung und Absage

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Profil im Portal

**Files:**
- Create: `shared/utils/employerSchema.ts`, `server/api/portal/employer.get.ts`, `server/api/portal/employer.patch.ts`, `server/api/portal/upload.post.ts`, `app/pages/portal/profil.vue`
- Test: `tests/unit/employerSchema.test.ts`

**Interfaces:**
- `employerSchema`: `name` (2–120), `legal_name` (≤ 160), `color_primary`/`color_secondary` (Hex `#rrggbb` oder leer), `address_street`/`address_zip` (4–5 Ziffern)/`address_city` (Pflicht), `phone` (≤ 40), `website` (URL oder leer), `apply_email` (E-Mail), `apply_whatsapp` (Ziffern 8–16 oder leer), `service_area` (≤ 200), `about` (≤ 1000), `schedule_model` (≤ 500), `benefits` (Array `{ label 1–80, detail ≤ 160 }`, ≤ 12), `notify_reminders` (bool), `report_email` (E-Mail oder leer), `template_invite`/`template_reject` (≤ 2000). `logo` wird separat über Upload gesetzt (`PATCH` akzeptiert `logo: uuid | null`).
- `POST /api/portal/upload` (multipart, Feld `file`, ≤ 2 MB, `image/png|jpeg|svg+xml|webp`) → `{ id }`; lädt nach Directus `/files` mit App-Token und setzt `employers.logo`.

- [ ] **Step 1: Test**

```ts
// tests/unit/employerSchema.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { employerSchema } from '../../shared/utils/employerSchema.ts'
const ok = { name: 'Sonnenhof', address_street: 'A 1', address_zip: '04277', address_city: 'Leipzig', apply_email: 'demo@example.com' }
test('Minimalprofil gültig, Defaults gesetzt', () => {
  const r = employerSchema.safeParse(ok)
  assert.equal(r.success, true)
  if (r.success) { assert.deepEqual(r.data.benefits, []); assert.equal(r.data.notify_reminders, true) }
})
test('Farben, PLZ, WhatsApp, Website werden geprüft', () => {
  assert.equal(employerSchema.safeParse({ ...ok, color_primary: 'grün' }).success, false)
  assert.equal(employerSchema.safeParse({ ...ok, color_primary: '#1d6b57' }).success, true)
  assert.equal(employerSchema.safeParse({ ...ok, address_zip: '12' }).success, false)
  assert.equal(employerSchema.safeParse({ ...ok, apply_whatsapp: '+49 151' }).success, false)
  assert.equal(employerSchema.safeParse({ ...ok, apply_whatsapp: '491511234567' }).success, true)
  assert.equal(employerSchema.safeParse({ ...ok, website: 'sonnenhof' }).success, false)
  assert.equal(employerSchema.safeParse({ ...ok, benefits: [{ label: '' }] }).success, false)
})
```

- [ ] **Step 2: Test rot, Implementierung, grün**

```ts
// shared/utils/employerSchema.ts
import { z } from 'zod'
const optStr = (max: number) => z.string().trim().max(max).optional().default('')
const emptyOr = <T extends z.ZodTypeAny>(inner: T) => z.preprocess((v) => (typeof v === 'string' ? v.trim() : v ?? ''), z.union([z.literal(''), inner])).default('')
export const employerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  legal_name: optStr(160),
  color_primary: emptyOr(z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farbe als #rrggbb')),
  color_secondary: emptyOr(z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farbe als #rrggbb')),
  address_street: z.string().trim().min(2).max(120),
  address_zip: z.string().trim().regex(/^\d{4,5}$/, 'PLZ mit 4 bis 5 Ziffern'),
  address_city: z.string().trim().min(2).max(80),
  phone: optStr(40),
  website: emptyOr(z.string().url('Bitte mit https:// angeben')),
  apply_email: z.string().trim().email(),
  apply_whatsapp: emptyOr(z.string().regex(/^\d{8,16}$/, 'Nur Ziffern, international ohne Plus')),
  service_area: optStr(200),
  about: optStr(1000),
  schedule_model: optStr(500),
  benefits: z.array(z.object({ label: z.string().trim().min(1).max(80), detail: z.string().trim().max(160).optional().default('') })).max(12).default([]),
  notify_reminders: z.boolean().default(true),
  report_email: emptyOr(z.string().email()),
  template_invite: optStr(2000),
  template_reject: optStr(2000),
  logo: z.string().uuid().nullable().optional(),
})
export type EmployerInput = z.infer<typeof employerSchema>
```
Run: `yarn test` → PASS.

- [ ] **Step 3: Routen**

`employer.get.ts`: `requirePortalUser` → `employer` zurückgeben (alle Felder).
`employer.patch.ts`: Body mit `employerSchema` validieren (Bestand gemischt wie bei Stellen), `appFetch('/items/employers/<id>', PATCH)`. `domains`, `slug`, `status`, `is_demo` werden nie aus dem Body übernommen.
`upload.post.ts`: `readMultipartFormData(event)`, Datei prüfen (Typ, Größe), per `FormData` an `${directusUrl}/files` mit App-Token (`$fetch` mit `body: formData`), danach `PATCH employers { logo: id }`; Antwort `{ id }`.

- [ ] **Step 4: Seite**

`app/pages/portal/profil.vue`: Formular nach Spec in Gruppen (Dienst, Kontakt, Arbeiten bei uns, Benefits mit Hinzufügen/Entfernen, Benachrichtigungen, Vorlagen mit Platzhalter-Hinweis und Knopf „Standard einsetzen“), Logo-Upload (`<input type="file">` → `/api/portal/upload`, Vorschau über `${directusUrl}/assets/<id>?width=160`). Speichern → `PATCH`, Erfolgsmeldung, 422-Fehler inline. `definePageMeta({ layout: 'portal', middleware: 'portal' })`.

- [ ] **Step 5: Prüfen und Commit**

Profil ändern (Benefit hinzufügen, Dienstplan-Text), speichern; Stellenseite zeigt die Änderung. Logo hochladen → erscheint im Kopf der Stellenseite und im JobPosting (`hiringOrganization.logo`). Ungültige Farbe → Fehler. `yarn test` grün.
```bash
git add shared/utils/employerSchema.ts tests/unit/employerSchema.test.ts server/api/portal/employer.get.ts server/api/portal/employer.patch.ts server/api/portal/upload.post.ts app/pages/portal/profil.vue
git commit -m "Arbeitgeberprofil im Portal mit Logo-Upload und Vorlagen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Erinnerungen und Monatsreport

**Files:**
- Create: `shared/utils/reminders.ts`, `shared/utils/report.ts`, `server/tasks/reminders.ts`, `server/tasks/report.ts`, `server/api/tasks/[name].post.ts`
- Modify: `server/utils/notify.ts` (zwei Mail-Templates)
- Test: `tests/unit/reminders.test.ts`, `tests/unit/report.test.ts`

**Interfaces:**
- `selectReminderCandidates(applications: Array<{ id; status; date_created; reminder_sent_at: string | null; employer: { id; notify_reminders?: boolean | null } }>, now: Date): Array<typeof applications[number]>` – `status = neu`, Alter ≥ 24 h, `reminder_sent_at` null, Dienst mit Erinnerungen an. `groupByEmployer(list)` → `Map<employerId, list>`.
- `aggregateReport({ monthStart, monthEnd, views, applications, jobs })` → `{ viewsBySource: Record<string, number>; applicationsByJob: Array<{ title; count }>; medianHoursToContact: number | null; jobsActive: number; jobsExpired: number; total: { views; applications } }`; nur Datensätze mit `day`/`date_created` im Bereich `[monthStart, monthEnd]`.
- `previousMonthRange(now: Date): { monthStart: string; monthEnd: string; label: string }` (z. B. `'2026-09-01'`, `'2026-09-30'`, `'September 2026'`).
- Tasks: `reminders` (stündlich), `report` (täglich 06:00, aktiv nur am 1.). `POST /api/tasks/:name` mit Header `x-task-secret` führt denselben Code aus (`runTask`).

- [ ] **Step 1: Tests**

```ts
// tests/unit/reminders.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { selectReminderCandidates, groupByEmployer } from '../../shared/utils/reminders.ts'
const now = new Date('2026-10-02T12:00:00Z')
const e = { id: 'e1', notify_reminders: true }
const mk = (p: any) => ({ id: 'x', status: 'neu', date_created: '2026-10-01T11:00:00Z', reminder_sent_at: null, employer: e, ...p })
test('genau 24 h zählt, 23:59 nicht; nur neu; nicht doppelt; Dienst mit Erinnerungen aus wird übersprungen', () => {
  assert.equal(selectReminderCandidates([mk({ date_created: '2026-10-01T12:00:00Z' })], now).length, 1)
  assert.equal(selectReminderCandidates([mk({ date_created: '2026-10-01T12:01:00Z' })], now).length, 0)
  assert.equal(selectReminderCandidates([mk({ status: 'kontaktiert' })], now).length, 0)
  assert.equal(selectReminderCandidates([mk({ reminder_sent_at: '2026-10-02T10:00:00Z' })], now).length, 0)
  assert.equal(selectReminderCandidates([mk({ employer: { id: 'e2', notify_reminders: false } })], now).length, 0)
  assert.equal(selectReminderCandidates([mk({ employer: { id: 'e3', notify_reminders: null } })], now).length, 1)
})
test('groupByEmployer', () => {
  const g = groupByEmployer([mk({ id: 'a' }), mk({ id: 'b', employer: { id: 'e2', notify_reminders: true } }), mk({ id: 'c' })])
  assert.deepEqual([...g.keys()], ['e1', 'e2'])
  assert.equal(g.get('e1')!.length, 2)
})
```

```ts
// tests/unit/report.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aggregateReport, previousMonthRange } from '../../shared/utils/report.ts'

test('previousMonthRange am 1. Oktober liefert September', () => {
  assert.deepEqual(previousMonthRange(new Date(2026, 9, 1, 6)), { monthStart: '2026-09-01', monthEnd: '2026-09-30', label: 'September 2026' })
  assert.deepEqual(previousMonthRange(new Date(2026, 0, 1, 6)), { monthStart: '2025-12-01', monthEnd: '2025-12-31', label: 'Dezember 2025' })
})
test('aggregiert nur den Monat, Median über erreichte Bewerbungen, null ohne Daten', () => {
  const r = aggregateReport({
    monthStart: '2026-09-01', monthEnd: '2026-09-30',
    views: [{ day: '2026-09-10', source: 'google', count: 7 }, { day: '2026-09-11', source: 'wa', count: 3 }, { day: '2026-10-01', source: 'google', count: 99 }],
    applications: [
      { date_created: '2026-09-05T10:00:00Z', first_contact_at: '2026-09-05T12:00:00Z', job: { id: 'j1', title: 'PFK' } },
      { date_created: '2026-09-06T10:00:00Z', first_contact_at: '2026-09-06T16:00:00Z', job: { id: 'j1', title: 'PFK' } },
      { date_created: '2026-09-07T10:00:00Z', first_contact_at: null, job: { id: 'j2', title: 'PHK' } },
      { date_created: '2026-08-30T10:00:00Z', first_contact_at: null, job: { id: 'j2', title: 'PHK' } },
    ],
    jobs: [{ status: 'published', valid_through: '2026-12-01' }, { status: 'expired', valid_through: '2026-09-15' }],
  })
  assert.deepEqual(r.viewsBySource, { google: 7, wa: 3 })
  assert.deepEqual(r.applicationsByJob, [{ title: 'PFK', count: 2 }, { title: 'PHK', count: 1 }])
  assert.equal(r.medianHoursToContact, 4)
  assert.deepEqual(r.total, { views: 10, applications: 3 })
  assert.equal(r.jobsActive, 1); assert.equal(r.jobsExpired, 1)
  const leer = aggregateReport({ monthStart: '2026-09-01', monthEnd: '2026-09-30', views: [], applications: [], jobs: [] })
  assert.equal(leer.medianHoursToContact, null)
  assert.deepEqual(leer.total, { views: 0, applications: 0 })
})
```

- [ ] **Step 2: Tests rot, Implementierung, grün**

```ts
// shared/utils/reminders.ts
export interface ReminderCandidate { id: string; status: string; date_created: string; reminder_sent_at: string | null; employer: { id: string; notify_reminders?: boolean | null } }
const DAY_MS = 24 * 60 * 60 * 1000
export function selectReminderCandidates<T extends ReminderCandidate>(list: T[], now: Date): T[] {
  return list.filter((a) => a.status === 'neu' && !a.reminder_sent_at && a.employer?.notify_reminders !== false && now.getTime() - new Date(a.date_created).getTime() >= DAY_MS)
}
export function groupByEmployer<T extends ReminderCandidate>(list: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const a of list) { const k = a.employer.id; if (!m.has(k)) m.set(k, []); m.get(k)!.push(a) }
  return m
}
```

```ts
// shared/utils/report.ts
export interface ReportInput {
  monthStart: string; monthEnd: string
  views: Array<{ day: string; source: string; count: number }>
  applications: Array<{ date_created: string; first_contact_at: string | null; job: { id: string; title: string } | null }>
  jobs: Array<{ status: string; valid_through: string | null }>
}
const pad = (n: number) => String(n).padStart(2, '0')
export function previousMonthRange(now: Date) {
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const start = new Date(first.getFullYear(), first.getMonth() - 1, 1)
  const end = new Date(first.getFullYear(), first.getMonth(), 0)
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { monthStart: iso(start), monthEnd: iso(end), label: start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) }
}
export function aggregateReport(i: ReportInput) {
  const inRange = (d: string) => { const x = d.slice(0, 10); return x >= i.monthStart && x <= i.monthEnd }
  const viewsBySource: Record<string, number> = {}
  for (const v of i.views) if (inRange(v.day)) viewsBySource[v.source] = (viewsBySource[v.source] || 0) + (v.count || 0)
  const apps = i.applications.filter((a) => inRange(a.date_created))
  const byJob = new Map<string, { title: string; count: number }>()
  for (const a of apps) { const k = a.job?.id ?? '-'; const cur = byJob.get(k) ?? { title: a.job?.title ?? 'Unbekannt', count: 0 }; cur.count++; byJob.set(k, cur) }
  const hours = apps.filter((a) => a.first_contact_at).map((a) => (new Date(a.first_contact_at!).getTime() - new Date(a.date_created).getTime()) / 3600000).sort((x, y) => x - y)
  const median = hours.length ? (hours.length % 2 ? hours[(hours.length - 1) / 2]! : (hours[hours.length / 2 - 1]! + hours[hours.length / 2]!) / 2) : null
  return {
    viewsBySource,
    applicationsByJob: [...byJob.values()].sort((a, b) => b.count - a.count),
    medianHoursToContact: median === null ? null : Math.round(median * 10) / 10,
    jobsActive: i.jobs.filter((j) => j.status === 'published' && !!j.valid_through && j.valid_through.slice(0, 10) > i.monthEnd).length,
    jobsExpired: i.jobs.filter((j) => j.status === 'expired' || (!!j.valid_through && j.valid_through.slice(0, 10) >= i.monthStart && j.valid_through.slice(0, 10) <= i.monthEnd)).length,
    total: { views: Object.values(viewsBySource).reduce((s, n) => s + n, 0), applications: apps.length },
  }
}
```
Run: `yarn test` → PASS (bei Abweichung im `jobsExpired`-Testfall die Implementierung an den Test anpassen; der Test ist die Vorgabe).

- [ ] **Step 3: Tasks, Endpoint, Mails**

In `notify.ts` ergänzen: `renderReminderMail({ employerName, items: Array<{ name; phone; jobTitle; hours }>, portalUrl })` (Betreff „Erinnerung: {n} Bewerbungen warten auf Rückruf“, Liste mit `tel:`-Links, Link ins Portal) und `renderReportMail({ employerName, label, report, portalUrl })` (Betreff „Ihr Bewerbungsreport {label}“, Tabelle Aufrufe nach Quelle, Bewerbungen nach Stelle, Median Stunden bis Rückruf, Stellen aktiv/abgelaufen; bei `medianHoursToContact === null` „noch keine Rückrufe erfasst“).

```ts
// server/tasks/reminders.ts
import { selectReminderCandidates, groupByEmployer } from '#shared/utils/reminders'
import { appFetch, appItems } from '../utils/directus'
import { renderReminderMail, sendMail } from '../utils/notify'

export async function runReminders(now = new Date()) {
  const config = useRuntimeConfig()
  const rows = await appItems<any>('applications', { filter: { status: { _eq: 'neu' }, reminder_sent_at: { _null: true } }, fields: 'id,status,name,phone,date_created,reminder_sent_at,job.title,employer.id,employer.name,employer.apply_email,employer.notify_reminders,employer.domains' })
  const groups = groupByEmployer(selectReminderCandidates(rows, now))
  let sent = 0
  for (const [, items] of groups) {
    const employer = items[0]!.employer
    try {
      const portalUrl = (config.portalBaseUrl as string) || (employer.domains?.[0] ? `https://${employer.domains[0]}` : (config.public.siteUrl as string))
      const mail = renderReminderMail({ employerName: employer.name, portalUrl: `${portalUrl}/portal/bewerbungen`, items: items.map((a: any) => ({ name: a.name, phone: a.phone, jobTitle: a.job?.title ?? '', hours: Math.round((now.getTime() - new Date(a.date_created).getTime()) / 3600000) })) })
      await sendMail(employer.apply_email, config.notifyBcc as string, mail)
      for (const a of items) await appFetch(`/items/applications/${a.id}`, { method: 'PATCH', body: { reminder_sent_at: now.toISOString() } })
      sent++
    } catch (err: unknown) {
      console.error('[reminders] Dienst übersprungen:', employer.id, err instanceof Error ? err.message : err)
    }
  }
  return { employers: sent }
}
export default defineTask({ meta: { name: 'reminders', description: 'Erinnerung bei Bewerbungen ohne Rückruf' }, run: async () => ({ result: await runReminders() }) })
```

```ts
// server/tasks/report.ts
import { aggregateReport, previousMonthRange } from '#shared/utils/report'
import { appItems } from '../utils/directus'
import { renderReportMail, sendMail } from '../utils/notify'

export async function runReport(now = new Date(), { force = false } = {}) {
  if (!force && now.getDate() !== 1) return { skipped: 'nicht der 1. des Monats' }
  const config = useRuntimeConfig()
  const range = previousMonthRange(now)
  const employers = await appItems<any>('employers', { filter: { status: { _eq: 'published' } }, fields: 'id,name,apply_email,report_email,domains' })
  let sent = 0
  for (const e of employers) {
    try {
      const [jobs, views, applications] = await Promise.all([
        appItems('jobs', { filter: { employer: { _eq: e.id }, date_posted: { _lte: range.monthEnd } }, fields: 'status,valid_through' }),
        appItems('job_views', { filter: { employer: { _eq: e.id }, day: { _between: [range.monthStart, range.monthEnd] } }, fields: 'day,source,count' }),
        appItems('applications', { filter: { employer: { _eq: e.id } }, fields: 'date_created,first_contact_at,job.id,job.title' }),
      ])
      if (!jobs.length) continue
      const report = aggregateReport({ ...range, views, applications, jobs })
      const portalUrl = (config.portalBaseUrl as string) || (e.domains?.[0] ? `https://${e.domains[0]}` : (config.public.siteUrl as string))
      await sendMail(e.report_email || e.apply_email, config.notifyBcc as string, renderReportMail({ employerName: e.name, label: range.label, report, portalUrl: `${portalUrl}/portal` }))
      sent++
    } catch (err: unknown) {
      console.error('[report] Dienst übersprungen:', e.id, err instanceof Error ? err.message : err)
    }
  }
  return { employers: sent, month: range.label }
}
export default defineTask({ meta: { name: 'report', description: 'Monatsreport an alle Dienste' }, run: async () => ({ result: await runReport() }) })
```

```ts
// server/api/tasks/[name].post.ts
// Manueller oder externer Cron-Auslöser. Header x-task-secret muss TASK_SECRET entsprechen.
import { runReminders } from '../../tasks/reminders'
import { runReport } from '../../tasks/report'
export default defineEventHandler(async (event) => {
  const { taskSecret } = useRuntimeConfig(event)
  if (!taskSecret || getHeader(event, 'x-task-secret') !== taskSecret) throw createError({ statusCode: 403 })
  const name = getRouterParam(event, 'name')
  const force = getQuery(event).force === '1'
  if (name === 'reminders') return runReminders()
  if (name === 'report') return runReport(new Date(), { force })
  throw createError({ statusCode: 404, statusMessage: 'Unbekannter Task' })
})
```

- [ ] **Step 4: Prüfen**

Eine Test-Bewerbung in Directus per Admin-Token auf `date_created` vor 25 h setzen (oder eine neue anlegen und das Feld patchen). `curl -X POST http://localhost:3000/api/tasks/reminders -H "x-task-secret: <aus .env>"` → `{ employers: 1 }`, Mailvorschau im Log, `reminder_sent_at` gesetzt; zweiter Aufruf → `{ employers: 0 }`. `curl -X POST "http://localhost:3000/api/tasks/report?force=1" -H …` → Mail mit Zahlen des Vormonats. Ohne Header → 403. `yarn test` grün. Test-Bewerbung löschen.

- [ ] **Step 5: Commit**

```bash
git add shared/utils/reminders.ts shared/utils/report.ts tests/unit/reminders.test.ts tests/unit/report.test.ts server/tasks server/api/tasks server/utils/notify.ts
git commit -m "Erinnerung nach 24 Stunden und Monatsreport als Nitro-Tasks mit Endpoint-Fallback

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Abschluss: Doku, Typecheck, Build, Rundlauf

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `docs/design-konzept.md`

- [ ] **Step 1: Alles grün**

```bash
yarn test
npx vue-tsc --noEmit -p .nuxt/tsconfig.json
npx vue-tsc --noEmit -p .nuxt/tsconfig.server.json
yarn build
```
Erwartet: alle Tests PASS (Teil 1: 22, dazu die neuen), nur die 2 bekannten Base-Fehler, Build ok.

- [ ] **Step 2: Rundlauf dokumentieren**

README: Abschnitt „Portal“ (Login-Ablauf, Nutzer anlegen in Directus `portal_users`, Rhowerk-Rolle mit Dienst-Umschalter), „Domains“ (Dienst bekommt Hostnamen in `employers.domains`; lokal `*.localhost`; `EMPLOYER_SLUG` nur Fallback), „Hintergrund-Jobs“ (Nitro-Tasks, externer Cron per `POST /api/tasks/<name>` mit `x-task-secret`, `?force=1` für den Report), „Umgebungsvariablen“ (alle neuen). Demo-Ablauf um Portal-Schritte erweitern: Bewerbung im Portal auf „Kontaktiert“, Erinnerung per Endpoint auslösen, Report per Endpoint auslösen.

CLAUDE.md: Harte Regeln ergänzen (App-Token nur im Server, Portal-Routen filtern nach Dienst, kein Versand an Bewerber), Dateikarte um Portal-Dateien erweitern. `docs/design-konzept.md`: Abschnitt „Portal“ (neutrale Farben, Tabellen, Formulare einspaltig).

- [ ] **Step 3: Commit**

```bash
git add README.md CLAUDE.md docs/design-konzept.md
git commit -m "Doku Teil 2: Portal, Domains, Hintergrund-Jobs, Demo-Ablauf

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
