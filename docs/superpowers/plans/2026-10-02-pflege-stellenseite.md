# Stellenseite für Pflegedienste – Umsetzungsplan (Teil 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pro offene Stelle eines Pflegedienstes eine öffentliche Bewerbungsseite mit JobPosting-Markup, Kurzbewerbung vom Handy, Teilen-Link, QR-Aushang, Google-Vorschau und Prüfbericht, Daten in Directus.

**Architecture:** Das Repo `checklist` wird aus einer Kopie von `nuxt-directus-base` aufgebaut (Nuxt 4 + Directus 11 per Docker). Drei neue Collections (`employers`, `jobs`, `applications`) kommen über ein eigenes idempotentes Schema-Skript. Nuxt rendert einen Dienst (`EMPLOYER_SLUG`), liest Stellen anonym, nimmt Bewerbungen über eine Server-Route an und speichert sie per Public-Create. Alle reinen Funktionen (Sichtbarkeit, JobPosting, Prüfung, Validierung) liegen in `shared/utils/` und sind mit dem Node-Test-Runner getestet.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Tailwind v4, shadcn-nuxt, nuxt-directus, Directus 11 (Docker, Postgres 16), zod, nodemailer, qrcode, google-auth-library, Node-Test-Runner (`node --test`, Node ≥ 24).

**Spec:** `docs/superpowers/specs/2026-10-02-pflege-stellenseite-design.md`

## Global Constraints

- Schema-Änderungen **nur** über `scripts/setup-schema.mjs` und `scripts/setup-schema-jobs.mjs` (Helfer aus `scripts/lib/`). Keine Handarbeit im Directus-UI.
- `applications`: Public-Policy darf **nur anlegen**, nie lesen. `employers` und `jobs` sind public lesbar, nur `status = published`; `jobs` zusätzlich `valid_through >= $NOW`.
- Sichtbare Stelle = `status === 'published'` **und** `valid_through >= heute`. Alles andere: 404, nicht in Liste, nicht in Sitemap.
- Demo-Kennzeichnung hängt ausschließlich an `employers.is_demo`. Die Google-Vorschau trägt immer das Banner „Demo: Dies ist eine Nachbildung, keine echte Google-Seite.“ und den Hinweistext aus der Spec (wörtlich, siehe Task 12).
- Keine Google-Logos oder -Wortmarken in der Vorschau. Seitentitel „Vorschau Jobbox“.
- Aushang und Google-Vorschau: `noindex`, nicht in Navigation, nicht in Sitemap.
- Ohne SMTP-Konfiguration: Mail ins Log **und** als HTML unter `.data/mail-preview/<id>.html`, Vorschau unter `/__mail/<id>` nur im Dev-Modus.
- Rate-Limit `/api/apply`: max. 5 Bewerbungen pro IP und Stunde.
- Commits auf Deutsch, letzte Zeile `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Keine Werte aus `.env` oder `docker/.env` in Ausgaben, Commits oder Docs.
- Windows / Git Bash: PowerShell kennt kein `&&`; in Git Bash Pfade wie `/jobs` bei Chrome-Aufrufen mit `MSYS_NO_PATHCONV=1`.

## Review Focus

1. **Ablaufdatum um Mitternacht**: `valid_through = heute` muss sichtbar sein, `valid_through = gestern` nicht; Vergleich nur über Datums-Strings `YYYY-MM-DD`, keine Zeitzonen-Arithmetik. → Test in Task 3.
2. **Gehalt nur mit Mindestwert** oder gar nicht: `baseSalary` darf nur erscheinen, wenn `salary_min` gesetzt ist, `maxValue` fehlt dann. → Test in Task 4.
3. **Stelle wird zwischen Laden und Absenden geschlossen**: `/api/apply` muss die Stelle erneut laden und bei Unsichtbarkeit 404 liefern, nichts speichern. → Test in Task 10 (manuell, Schritt dokumentiert) und Schutz im Code.
4. **Telefonnummern in Alltagsschreibweise** („0151 123 45 67“, „+49 151 1234567“, „0151/1234567“) müssen durchgehen, „abc“ nicht. → Test in Task 6.
5. **Einsatzort-Override nur teilweise gefüllt** (z. B. nur Stadt): Adresse muss komplett aus dem Dienst kommen, nie gemischt, sonst erzeugt Google eine unvollständige Adresse. → Test in Task 3.

---

### Task 1: Repo aus dem Base-Repo aufbauen und Demo entfernen

**Files:**
- Create: alles aus `../nuxt-directus-base` außer `.git`, `node_modules`, `.nuxt`, `design/`, `.env`, `docker/.env`
- Delete: `app/pages/sortiment/`, `app/components/ProductCard.vue`, `app/components/blocks/Products.vue`, `app/utils/product.ts`, `scripts/seed-assets/`
- Modify: `scripts/setup-schema.mjs`, `app/components/Website/ContentBlockBuilder.vue`, `server/api/__sitemap__/pages.ts`, `package.json`, `README.md`, `CLAUDE.md`
- Delete (alt): `app/app.vue`, `app/assets/css/main.css`, `nuxt.config.ts`, `package.json`, `tsconfig.json`, `yarn.lock`, `README.md` des bisherigen Starters (werden durch die Base-Versionen ersetzt)

**Interfaces:**
- Produces: lauffähiges Nuxt-Projekt mit Directus-Docker, Schema-Skript ohne `products`/`block_products`, Script `yarn test`.

- [ ] **Step 1: Alten Starter entfernen, Base kopieren**

```bash
cd /c/Users/WildC/OneDrive/Dokumente/GitHub/checklist
rm -rf app public nuxt.config.ts package.json tsconfig.json yarn.lock README.md .nuxt node_modules .gitignore
rsync -a --exclude .git --exclude node_modules --exclude .nuxt --exclude design --exclude .env --exclude docker/.env --exclude .netlify ../nuxt-directus-base/ ./
ls app server scripts shared docker docs
```
Erwartet: Ordner `app`, `server`, `scripts`, `shared`, `docker`, `docs` vorhanden; `docs/superpowers/` aus diesem Repo ist unverändert (rsync ohne `--delete`).

Falls `rsync` fehlt (Git Bash ohne rsync): stattdessen
```bash
cp -r ../nuxt-directus-base/. ./ && rm -rf .git_base node_modules .nuxt design .env docker/.env
```
und danach prüfen, dass `.git` noch das Git von `checklist` ist: `git log --oneline | head -2` zeigt die beiden Spec-Commits.

- [ ] **Step 2: Blumenhaus-Demo löschen**

```bash
rm -rf app/pages/sortiment app/components/ProductCard.vue app/components/blocks/Products.vue app/utils/product.ts scripts/seed-assets
grep -rn "product" app server scripts --include=*.vue --include=*.ts --include=*.mjs -il
```
Erwartet: Trefferliste zeigt nur noch `scripts/setup-schema.mjs`, `scripts/seed-content.mjs`, `app/components/Website/ContentBlockBuilder.vue`, `server/api/__sitemap__/pages.ts`, evtl. `app/components/blocks/Contact.vue` (Feld `product` im Formular, bleibt).

- [ ] **Step 3: `setup-schema.mjs` bereinigen**

In `scripts/setup-schema.mjs`:
- Den gesamten `await ensureCollection('block_products', …)`-Block entfernen.
- Den gesamten `await ensureCollection('products', …)`-Block und die dazugehörige `filesJunction('products_files', …)`-Zeile entfernen.
- Die Zeile `await ensureRelation({ collection: 'products', field: 'seo', … })` entfernen.
- In `BLOCK_COLLECTIONS` den Eintrag `'block_products'` entfernen.
- In der Zeile `for (const sub of ['block_cards_items', 'block_gallery_files', 'products_files'])` das `'products_files'` entfernen.
- Die Zeile `await ensurePublicRead('products', …)` entfernen.
- Kopfkommentar: Hinweis auf „products“ streichen.

Prüfen:
```bash
grep -n "product" scripts/setup-schema.mjs
```
Erwartet: keine Treffer.

- [ ] **Step 4: `ContentBlockBuilder.vue` und Sitemap bereinigen**

In `app/components/Website/ContentBlockBuilder.vue` die Mapping-Zeile `block_products: resolveComponent('LazyBlocksProducts'),` entfernen.

`server/api/__sitemap__/pages.ts` komplett ersetzen (Jobs kommen in Task 14 dazu):
```ts
// Sitemap-Quelle für @nuxtjs/sitemap: alle veröffentlichten CMS-Seiten aus Directus (anonym gelesen, wie redirects.ts).
// Die Startseite (general.homepage) wird unter / ausgeliefert, nicht unter ihrem Slug. Seiten mit seo.no_index bleiben draußen.
import type { SitemapUrlInput } from '#sitemap/types'

type PageRow = { id: number; slug: string | null; date_updated: string | null; seo: { no_index: boolean | null } | null }

const FETCH_TIMEOUT_MS = 5000

export default defineSitemapEventHandler(async (event) => {
  const directusUrl = useRuntimeConfig(event).public.directusUrl as string | undefined
  if (!directusUrl) return []

  try {
    const [pagesRes, generalRes] = await Promise.all([
      $fetch<{ data: PageRow[] }>(`${directusUrl}/items/pages`, {
        query: { fields: 'id,slug,date_updated,seo.no_index', filter: { status: { _eq: 'published' } }, limit: -1 },
        timeout: FETCH_TIMEOUT_MS,
      }),
      $fetch<{ data: { homepage: number | null } }>(`${directusUrl}/items/general`, {
        query: { fields: 'homepage' },
        timeout: FETCH_TIMEOUT_MS,
      }),
    ])
    const homepageId = generalRes?.data?.homepage ?? null
    return (pagesRes?.data ?? [])
      .filter((p) => p.seo?.no_index !== true && (p.id === homepageId || p.slug))
      .map((p): SitemapUrlInput => ({
        loc: p.id === homepageId ? '/' : `/${p.slug}`,
        ...(p.date_updated ? { lastmod: p.date_updated } : {}),
      }))
  } catch (err: unknown) {
    console.warn('Sitemap: Seiten konnten nicht aus Directus geladen werden:', err instanceof Error ? err.message : err)
    return []
  }
})
```

- [ ] **Step 5: `seed-content.mjs` auf Minimal-Seed kürzen**

`scripts/seed-content.mjs` komplett ersetzen (Demo-Dienst und Stellen kommen in Task 7):
```js
// scripts/seed-content.mjs
// Grundinhalt: general, Impressum, Datenschutz (Platzhalter), Menüs. Idempotent (Seiten per Slug, Menüs per Titel).
// Demo-Dienst und Stellen legt scripts/seed-jobs.mjs an.
// Aufruf: yarn directus:seed   (braucht DIRECTUS_URL + DIRECTUS_ADMIN_TOKEN in .env)
import { directus, upsertItem, readItems, createItem, deleteItems, updateSingleton } from './lib/directus-admin.mjs';

const SITE_NAME = process.env.SITE_NAME || 'Pflege-Jobs';
const block = (collection, data) => ({ collection, data });

async function upsertPage(slug, data, blocks) {
  const page = await upsertItem('pages', { slug }, { status: 'published', slug, ...data }, slug);
  const existing = await directus.request(readItems('pages_blocks', { filter: { pages_id: { _eq: page.id } }, fields: ['id', 'collection', 'item'], limit: -1 }));
  if (existing.length) await directus.request(deleteItems('pages_blocks', existing.map((b) => b.id)));
  for (const [collection, items] of Object.entries(groupBy(existing, 'collection'))) {
    await directus.request(deleteItems(collection, items.map((b) => b.item)));
  }
  let sort = 1;
  for (const b of blocks) {
    const item = await directus.request(createItem(b.collection, b.data));
    await directus.request(createItem('pages_blocks', { pages_id: page.id, collection: b.collection, item: item.id, sort: sort++ }));
  }
  return page;
}
const groupBy = (arr, key) => arr.reduce((acc, x) => ((acc[x[key]] ??= []).push(x), acc), {});

console.log('\n[1/3] Seiten');
const impressum = await upsertPage('impressum', { title: 'Impressum' }, [
  block('block_text', { heading: 'Impressum', content: '<p>Angaben gemäß § 5 DDG – bitte im CMS ausfüllen.</p>', background: 'white', paddingBottom: true }),
]);
const datenschutz = await upsertPage('datenschutz', { title: 'Datenschutz' }, [
  block('block_text', { heading: 'Datenschutzerklärung', content: '<p>Bitte im CMS ausfüllen. Bewerbungsdaten werden ausschließlich zur Kontaktaufnahme durch den Pflegedienst verarbeitet.</p>', background: 'white', paddingBottom: true }),
]);
const start = await upsertPage('startseite', { title: 'Startseite' }, [
  block('block_text', { heading: SITE_NAME, content: '<p>Offene Stellen finden Sie unter <a href="/jobs">/jobs</a>.</p>', background: 'white', paddingBottom: true }),
]);

console.log('\n[2/3] Menüs');
async function upsertMenu(title, items) {
  const found = await directus.request(readItems('navigation', { filter: { title: { _eq: title } }, fields: ['id'], limit: 1 }));
  const nav = found[0] ?? await directus.request(createItem('navigation', { title }));
  const old = await directus.request(readItems('navigation_items', { filter: { navigation: { _eq: nav.id } }, fields: ['id'], limit: -1 }));
  if (old.length) await directus.request(deleteItems('navigation_items', old.map((i) => i.id)));
  let sort = 1;
  for (const it of items) await directus.request(createItem('navigation_items', { navigation: nav.id, sort: sort++, ...it }));
  console.log(`  ~ Menü ${title}`);
}
await upsertMenu('Main', [{ title: 'Offene Stellen', type: 'url', url: '/jobs' }]);
await upsertMenu('Footer', [{ title: 'Offene Stellen', type: 'url', url: '/jobs' }]);
await upsertMenu('Legal', [{ title: 'Impressum', type: 'page', page: impressum.id }, { title: 'Datenschutz', type: 'page', page: datenschutz.id }]);

console.log('\n[3/3] general');
await directus.request(updateSingleton('general', { homepage: start.id, claim: 'Bewerbungen vom Handy, in einer Minute.' }));
console.log('\nFertig.\n');
```
Hinweis: Die Feldnamen von `navigation_items` (`title`, `type`, `url`, `page`) und `general` (`homepage`, `claim`) sind die des Base-Schemas; bei Abweichung in `scripts/setup-schema.mjs` nachsehen und angleichen.

- [ ] **Step 6: `package.json` ergänzen**

In `scripts` ergänzen:
```json
"test": "node --test \"tests/**/*.test.ts\"",
"directus:schema:jobs": "node scripts/setup-schema-jobs.mjs",
"directus:seed:jobs": "node scripts/seed-jobs.mjs",
"google:index": "node --env-file=.env scripts/google-index.mjs"
```
`"name"` auf `"pflege-jobs"` setzen. Dependencies ergänzen:
```bash
yarn add zod nodemailer qrcode google-auth-library
yarn add -D @types/nodemailer @types/qrcode
```

- [ ] **Step 7: Umgebung und Docker**

```bash
yarn setup --name pflege-jobs --email admin@example.com
cd docker && docker compose up -d && cd ..
docker compose -f docker/docker-compose.yml ps
```
Erwartet: Container `pflege-jobs-directus-1` und `pflege-jobs-database-1` laufen. Dann im Browser `http://localhost:8055` einloggen (Zugang steht in `docker/.env`), beim Admin-User einen Static Token erzeugen und in `.env` als `DIRECTUS_ADMIN_TOKEN` eintragen. Zusätzlich in `.env` ergänzen:
```
EMPLOYER_SLUG=sonnenhof-leipzig
NOTIFY_BCC=
NUXT_MAIL_HOST=
NUXT_MAIL_PORT=587
NUXT_MAIL_SECURE=false
NUXT_MAIL_USER=
NUXT_MAIL_PASS=
NUXT_MAIL_FROM=
GOOGLE_SERVICE_ACCOUNT_JSON=
```
Dieselben Zeilen (mit leeren Werten) in `.env.example` eintragen.

- [ ] **Step 8: Schema und Seed laufen lassen, Dev-Server prüfen**

```bash
yarn directus:schema && yarn directus:seed
yarn dev
```
Erwartet: Schema-Skript endet ohne Fehler, Seed legt drei Seiten und drei Menüs an. `http://localhost:3000` zeigt die Startseite mit Menü „Offene Stellen“. `yarn test` meldet „no tests“ oder 0 Tests, aber keinen Fehler.

- [ ] **Step 9: README und CLAUDE.md für dieses Projekt**

`README.md` ersetzen durch eine Kurzfassung: Projektname, Zweck (ein Satz), Start in sechs Schritten (`yarn`, `yarn setup`, Docker, Token, `yarn directus:schema && yarn directus:schema:jobs`, `yarn directus:seed && yarn directus:seed:jobs`, `yarn dev`), Tests (`yarn test`), Umzug (`yarn directus:copy`), Link auf Spec und Plan.

`CLAUDE.md` des Base-Repos behalten, aber oben einen Abschnitt einfügen:
```markdown
# pflege-jobs – Stellenseiten für Pflegedienste

Projekt aus `nuxt-directus-base`. Spec: `docs/superpowers/specs/2026-10-02-pflege-stellenseite-design.md`, Plan: `docs/superpowers/plans/2026-10-02-pflege-stellenseite.md`.

## Harte Regeln
- Schema nur über `scripts/setup-schema.mjs` + `scripts/setup-schema-jobs.mjs`. Nichts von Hand in Directus anlegen (Umzug per `yarn directus:copy`).
- `applications` ist für Public nur anlegbar, nie lesbar.
- Sichtbare Stelle: `status = published` und `valid_through >= heute` (`isJobVisible` in `shared/utils/jobs.ts`).
- Demo-Kennzeichnung nur über `employers.is_demo`.
- Keine Werte aus `.env` ausgeben. Commits auf Deutsch, letzte Zeile `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
```
Den Abschnitt „Demo ‚Blumenhaus Hibiskus‘“ im Rest der Datei löschen.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Projekt aus nuxt-directus-base aufgesetzt, Blumenhaus-Demo entfernt

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Schema für employers, jobs, applications

**Files:**
- Create: `scripts/setup-schema-jobs.mjs`

**Interfaces:**
- Produces: Collections `employers`, `jobs`, `applications` mit den Feldern aus der Spec; Public-Read auf `employers` (published) und `jobs` (published + `valid_through >= $NOW`); Public-Create auf `applications` mit Feldern `job, employer, name, phone, qualification, hours_wish, earliest_start, message, source, consent, user_agent, referrer`.

- [ ] **Step 1: Skript schreiben**

```js
// scripts/setup-schema-jobs.mjs
// Collections für Stellenseiten: employers (Pflegedienste), jobs (Stellen), applications (Bewerbungen).
// Idempotent, läuft nach scripts/setup-schema.mjs. Aufruf: yarn directus:schema:jobs
import { ensureCollection, ensureRelation, ensurePublicRead, ensurePublicCreate } from './lib/directus-admin.mjs';
import { pkUuid, statusField, auditFields, input, slugField, textarea, richText, fileField, boolField, intField, dateField, select } from './lib/fields.mjs';

const uuidM2o = (field, template, note, extra = {}) => ({
  field, type: 'uuid',
  meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', note, options: { template }, ...extra },
  schema: {},
});
const jsonList = (field, note, fields, template) => ({
  field, type: 'json',
  meta: { interface: 'list', width: 'full', note, options: { fields, template } },
  schema: {},
});
const decimalField = (field, note, extra = {}) => ({ field, type: 'decimal', meta: { interface: 'input', width: 'half', note, ...extra }, schema: { numeric_precision: 10, numeric_scale: 2 } });
const timestampField = (field, note) => ({ field, type: 'timestamp', meta: { interface: 'datetime', width: 'half', note, readonly: true }, schema: {} });

const jobStatus = {
  field: 'status', type: 'string',
  meta: {
    interface: 'select-dropdown', width: 'half', display: 'labels',
    options: { choices: [
      { text: 'Veröffentlicht', value: 'published', color: '#2ECDA7' },
      { text: 'Entwurf', value: 'draft', color: '#FFC23B' },
      { text: 'Besetzt', value: 'filled', color: '#A2B5CD' },
      { text: 'Abgelaufen', value: 'expired', color: '#A2B5CD' },
    ] },
  },
  schema: { default_value: 'draft', is_nullable: false },
};

console.log('\n[1/4] Ordner');
await ensureCollection('Recruiting', { meta: { icon: 'work', note: 'Pflegedienste, Stellen, Bewerbungen', sort: 0, collapse: 'open' }, schema: null });

console.log('\n[2/4] Collections');
await ensureCollection('employers', {
  meta: { group: 'Recruiting', icon: 'local_hospital', note: 'Pflegedienste (ein Dienst = ein Mandant)', display_template: '{{name}}', sort: 1 },
  schema: {},
  fields: [
    pkUuid, statusField, ...auditFields,
    input('name', 'Name des Dienstes, z. B. „AWO Pflegedienst Leipzig-Süd“', { required: true }),
    slugField('slug', 'Kurzname für URLs und EMPLOYER_SLUG', { required: true }),
    input('legal_name', 'Rechtsträger (hiringOrganization), falls abweichend'),
    fileField('logo', 'Logo, quadratisch oder breit, PNG/SVG'),
    input('color_primary', 'Hauptfarbe als Hex, z. B. #1d6b57'),
    input('color_secondary', 'Zweitfarbe als Hex'),
    input('address_street', 'Straße und Hausnummer des Büros', { required: true }),
    input('address_zip', 'PLZ', { required: true }),
    input('address_city', 'Stadt', { required: true }),
    input('phone', 'Telefon, wie er auf der Seite stehen soll'),
    input('website', 'Website des Dienstes (https://…)'),
    input('apply_email', 'Empfänger für Bewerbungen', { required: true }),
    input('apply_whatsapp', 'WhatsApp-Nummer international ohne Plus, z. B. 491511234567'),
    input('service_area', 'Einsatzgebiet als Text, z. B. „Leipzig-Süd, Markkleeberg, Zwenkau“', { width: 'full' }),
    textarea('about', 'Kurzer Absatz über den Dienst, erscheint auf jeder Stellenseite'),
    textarea('schedule_model', 'Dienstplan-Modell, z. B. „Wunschdienstplan, max. 7 Tage am Stück“'),
    jsonList('benefits', 'Benefits', [
      { field: 'label', name: 'Benefit', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'detail', name: 'Detail (optional)', type: 'string', meta: { interface: 'input', width: 'half' } },
    ], '{{label}}'),
    boolField('is_demo', 'Demo-Dienst: zeigt überall den Hinweis „Demo-Daten, fiktiver Pflegedienst“'),
  ],
});

await ensureCollection('jobs', {
  meta: { group: 'Recruiting', icon: 'badge', note: 'Offene Stellen', display_template: '{{title}} – {{employer.name}}', sort: 2 },
  schema: {},
  fields: [
    pkUuid, jobStatus, ...auditFields,
    uuidM2o('employer', '{{name}}', 'Pflegedienst', { required: true }),
    input('title', 'Stellentitel, z. B. „Pflegefachkraft (m/w/d)“', { required: true }),
    input('slug', 'URL-Teil, eindeutig pro Dienst', { required: true, options: { slug: true, trim: true } }),
    { field: 'employment_types', type: 'json', meta: { interface: 'select-multiple-checkbox', width: 'half', note: 'Beschäftigungsart (Google-Werte)', options: { choices: [
      { text: 'Vollzeit', value: 'FULL_TIME' }, { text: 'Teilzeit', value: 'PART_TIME' }, { text: 'Befristet', value: 'TEMPORARY' },
      { text: 'Ausbildung / Praktikum', value: 'INTERN' }, { text: 'Freie Mitarbeit', value: 'CONTRACTOR' }, { text: 'Sonstiges', value: 'OTHER' },
    ] } }, schema: {} },
    intField('hours_min', 'Wochenstunden mindestens'),
    intField('hours_max', 'Wochenstunden höchstens'),
    input('start_note', 'Start, z. B. „ab sofort“ oder „01.12.2026“'),
    decimalField('salary_min', 'Gehalt von (brutto)'),
    decimalField('salary_max', 'Gehalt bis (brutto)'),
    select('salary_unit', [['MONTH', 'pro Monat'], ['HOUR', 'pro Stunde']], 'MONTH', 'Gehaltseinheit'),
    input('salary_note', 'Hinweis zum Gehalt, z. B. „nach TVöD-P plus Zulagen“', { width: 'full' }),
    { field: 'location_override', type: 'json', meta: { interface: 'input-code', width: 'full', note: 'Optional: abweichender Einsatzort als JSON { "street": "", "zip": "", "city": "" } – nur komplett ausfüllen', options: { language: 'json' } }, schema: {} },
    textarea('intro', 'Einleitung, 2–3 Sätze'),
    richText('tasks', 'Aufgaben'),
    richText('requirements', 'Voraussetzungen'),
    jsonList('benefits_override', 'Benefits nur für diese Stelle (sonst die des Dienstes)', [
      { field: 'label', name: 'Benefit', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'detail', name: 'Detail (optional)', type: 'string', meta: { interface: 'input', width: 'half' } },
    ], '{{label}}'),
    input('contact_name', 'Ansprechperson'),
    dateField('date_posted', 'Veröffentlicht am', { required: true }),
    dateField('valid_through', 'Gültig bis (danach 404 und raus aus Google)', { required: true }),
    input('apply_email_override', 'Abweichender Empfänger für Bewerbungen'),
    timestampField('google_indexed_at', 'Zuletzt bei Google gemeldet (setzt scripts/google-index.mjs)'),
  ],
});

await ensureCollection('applications', {
  meta: { group: 'Recruiting', icon: 'inbox', note: 'Bewerbungen (Public darf nur anlegen)', display_template: '{{name}} – {{job.title}}', sort: 3 },
  schema: {},
  fields: [
    pkUuid,
    select('status', [['neu', 'Neu'], ['kontaktiert', 'Kontaktiert'], ['gespraech', 'Gespräch'], ['zusage', 'Zusage'], ['absage', 'Absage']], 'neu', 'Stand'),
    { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half', display: 'datetime', display_options: { relative: true } }, schema: {} },
    uuidM2o('job', '{{title}}', 'Stelle', { required: true }),
    uuidM2o('employer', '{{name}}', 'Pflegedienst', { required: true }),
    input('name', 'Name', { required: true }),
    input('phone', 'Telefon', { required: true }),
    select('qualification', [['pflegefachkraft', 'Pflegefachkraft'], ['pflegehilfskraft', 'Pflegehilfskraft'], ['betreuungskraft_43b', 'Betreuungskraft § 43b'], ['auszubildende', 'Auszubildende/r'], ['hauswirtschaft', 'Hauswirtschaft'], ['sonstiges', 'Sonstiges']], 'sonstiges', 'Qualifikation'),
    select('hours_wish', [['vollzeit', 'Vollzeit'], ['teilzeit_30', 'Teilzeit ca. 30 h'], ['teilzeit_20', 'Teilzeit ca. 20 h'], ['minijob', 'Minijob'], ['offen', 'Offen']], 'offen', 'Wunschstunden'),
    input('earliest_start', 'Frühester Start'),
    textarea('message', 'Nachricht'),
    select('source', [['google', 'Google'], ['wa', 'WhatsApp'], ['qr', 'QR-Aushang'], ['direct', 'Direkt'], ['demo', 'Demo']], 'direct', 'Quelle'),
    boolField('consent', 'Einwilligung erteilt'),
    input('user_agent', 'Browser', { width: 'full' }),
    input('referrer', 'Referrer', { width: 'full' }),
  ],
});

console.log('\n[3/4] Relationen');
await ensureRelation({ collection: 'employers', field: 'logo', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } });
await ensureRelation({ collection: 'jobs', field: 'employer', related_collection: 'employers', meta: { one_field: 'jobs' }, schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'applications', field: 'job', related_collection: 'jobs', meta: { one_field: 'applications' }, schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'applications', field: 'employer', related_collection: 'employers', schema: { on_delete: 'CASCADE' } });

console.log('\n[4/4] Rechte');
await ensurePublicRead('employers', { permissions: { status: { _eq: 'published' } } });
await ensurePublicRead('jobs', { permissions: { _and: [{ status: { _eq: 'published' } }, { valid_through: { _gte: '$NOW' } }] } });
await ensurePublicCreate('applications', { fields: ['job', 'employer', 'name', 'phone', 'qualification', 'hours_wish', 'earliest_start', 'message', 'source', 'consent', 'user_agent', 'referrer'] });

console.log('\nFertig.\n');
```

- [ ] **Step 2: Zweimal laufen lassen (Idempotenz)**

```bash
yarn directus:schema:jobs && yarn directus:schema:jobs
```
Erwartet: Erster Lauf `+`-Zeilen, zweiter Lauf nur `=`-Zeilen, kein Fehler.

- [ ] **Step 3: Rechte prüfen**

```bash
curl -s "http://localhost:8055/items/jobs" ; echo
curl -s "http://localhost:8055/items/applications" ; echo
curl -s -X POST "http://localhost:8055/items/applications" -H "Content-Type: application/json" -d '{"name":"x"}' ; echo
```
Erwartet: erste Antwort `{"data":[]}`; zweite Antwort Fehler mit `FORBIDDEN` (kein Public-Read); dritte Antwort Fehler wegen fehlender Pflichtfelder (`job`, `employer`), **nicht** `FORBIDDEN` (Public-Create greift).

- [ ] **Step 4: Commit**

```bash
git add scripts/setup-schema-jobs.mjs
git commit -m "Schema: employers, jobs, applications mit Public-Rechten

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Domänen-Helfer `shared/utils/jobs.ts`

**Files:**
- Create: `shared/utils/jobs.ts`
- Test: `tests/unit/jobs.test.ts`

**Interfaces:**
- Produces:
  - `type Employer`, `type Job`, `type Benefit = { label: string; detail?: string }`
  - `EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string>`, `QUALIFICATION_LABELS`, `HOURS_WISH_LABELS`
  - `toIsoDate(d: Date): string` → `YYYY-MM-DD` in lokaler Zeit
  - `isJobVisible(job: Pick<Job,'status'|'valid_through'>, now?: Date): boolean`
  - `jobLocation(job: Pick<Job,'location_override'>, employer: Employer): { street: string; zip: string; city: string }`
  - `salaryText(job: Pick<Job,'salary_min'|'salary_max'|'salary_unit'>): string | null` → z. B. „3.400 – 3.900 € pro Monat“
  - `jobBenefits(job, employer): Benefit[]`
  - `jobPath(slug: string): string` → `/jobs/<slug>`

- [ ] **Step 1: Test schreiben**

```ts
// tests/unit/jobs.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isJobVisible, jobLocation, salaryText, jobBenefits, toIsoDate, jobPath } from '../../shared/utils/jobs.ts'

const employer = {
  id: 'e1', status: 'published', name: 'Sonnenhof', slug: 'sonnenhof', address_street: 'Bornaische Straße 12', address_zip: '04277', address_city: 'Leipzig',
  apply_email: 'demo@example.com', benefits: [{ label: 'Wunschdienstplan' }], is_demo: true,
} as any

test('toIsoDate liefert lokales Datum als YYYY-MM-DD', () => {
  assert.equal(toIsoDate(new Date(2026, 9, 2, 23, 59)), '2026-10-02')
})

test('Stelle ist sichtbar, wenn published und valid_through heute oder später', () => {
  const now = new Date(2026, 9, 2, 12)
  assert.equal(isJobVisible({ status: 'published', valid_through: '2026-10-02' }, now), true)
  assert.equal(isJobVisible({ status: 'published', valid_through: '2026-10-01' }, now), false)
  assert.equal(isJobVisible({ status: 'draft', valid_through: '2026-12-31' }, now), false)
  assert.equal(isJobVisible({ status: 'filled', valid_through: '2026-12-31' }, now), false)
  assert.equal(isJobVisible({ status: 'published', valid_through: null }, now), false)
})

test('jobLocation nimmt Override nur komplett, sonst Adresse des Dienstes', () => {
  assert.deepEqual(jobLocation({ location_override: null }, employer), { street: 'Bornaische Straße 12', zip: '04277', city: 'Leipzig' })
  assert.deepEqual(jobLocation({ location_override: { street: 'Hauptstr. 1', zip: '04416', city: 'Markkleeberg' } }, employer), { street: 'Hauptstr. 1', zip: '04416', city: 'Markkleeberg' })
  assert.deepEqual(jobLocation({ location_override: { city: 'Markkleeberg' } }, employer), { street: 'Bornaische Straße 12', zip: '04277', city: 'Leipzig' })
})

test('salaryText formatiert Spanne, Einzelwert und nichts', () => {
  assert.equal(salaryText({ salary_min: 3400, salary_max: 3900, salary_unit: 'MONTH' }), '3.400 – 3.900 € pro Monat')
  assert.equal(salaryText({ salary_min: 19.5, salary_max: null, salary_unit: 'HOUR' }), 'ab 19,50 € pro Stunde')
  assert.equal(salaryText({ salary_min: null, salary_max: 3900, salary_unit: 'MONTH' }), null)
})

test('jobBenefits bevorzugt Override, sonst Dienst, nie leer-undefined', () => {
  assert.deepEqual(jobBenefits({ benefits_override: null }, employer), [{ label: 'Wunschdienstplan' }])
  assert.deepEqual(jobBenefits({ benefits_override: [{ label: 'Dienstwagen' }] }, employer), [{ label: 'Dienstwagen' }])
  assert.deepEqual(jobBenefits({ benefits_override: [] }, employer), [{ label: 'Wunschdienstplan' }])
  assert.deepEqual(jobBenefits({ benefits_override: null }, { ...employer, benefits: null }), [])
})

test('jobPath', () => {
  assert.equal(jobPath('pflegefachkraft'), '/jobs/pflegefachkraft')
})
```

- [ ] **Step 2: Test laufen lassen, Fehler erwartet**

Run: `yarn test`
Expected: FAIL mit „Cannot find module … shared/utils/jobs.ts“

- [ ] **Step 3: Implementierung**

```ts
// shared/utils/jobs.ts
// Reine Domänen-Helfer für Stellen. Keine Nuxt-Imports – wird in Browser, Server und Tests genutzt.

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'INTERN' | 'CONTRACTOR' | 'OTHER'
export type SalaryUnit = 'MONTH' | 'HOUR'
export type JobStatus = 'published' | 'draft' | 'filled' | 'expired'
export type Benefit = { label: string; detail?: string | null }

export interface Employer {
  id: string
  status: string
  name: string
  slug: string
  legal_name?: string | null
  logo?: { id: string; title?: string | null } | string | null
  color_primary?: string | null
  color_secondary?: string | null
  address_street: string
  address_zip: string
  address_city: string
  phone?: string | null
  website?: string | null
  apply_email: string
  apply_whatsapp?: string | null
  service_area?: string | null
  about?: string | null
  schedule_model?: string | null
  benefits?: Benefit[] | null
  is_demo?: boolean | null
}

export interface Job {
  id: string
  status: JobStatus
  employer: Employer | string
  title: string
  slug: string
  employment_types?: EmploymentType[] | null
  hours_min?: number | null
  hours_max?: number | null
  start_note?: string | null
  salary_min?: number | string | null
  salary_max?: number | string | null
  salary_unit?: SalaryUnit | null
  salary_note?: string | null
  location_override?: { street?: string; zip?: string; city?: string } | null
  intro?: string | null
  tasks?: string | null
  requirements?: string | null
  benefits_override?: Benefit[] | null
  contact_name?: string | null
  date_posted: string
  valid_through: string | null
  apply_email_override?: string | null
  google_indexed_at?: string | null
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Vollzeit', PART_TIME: 'Teilzeit', TEMPORARY: 'Befristet', INTERN: 'Ausbildung / Praktikum', CONTRACTOR: 'Freie Mitarbeit', OTHER: 'Sonstiges',
}
export const QUALIFICATION_LABELS = {
  pflegefachkraft: 'Pflegefachkraft', pflegehilfskraft: 'Pflegehilfskraft', betreuungskraft_43b: 'Betreuungskraft § 43b',
  auszubildende: 'Auszubildende/r', hauswirtschaft: 'Hauswirtschaft', sonstiges: 'Sonstiges',
} as const
export const HOURS_WISH_LABELS = {
  vollzeit: 'Vollzeit', teilzeit_30: 'Teilzeit, ca. 30 Stunden', teilzeit_20: 'Teilzeit, ca. 20 Stunden', minijob: 'Minijob', offen: 'Noch offen',
} as const
export type Qualification = keyof typeof QUALIFICATION_LABELS
export type HoursWish = keyof typeof HOURS_WISH_LABELS

const pad = (n: number) => String(n).padStart(2, '0')
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isJobVisible(job: Pick<Job, 'status' | 'valid_through'>, now: Date = new Date()): boolean {
  if (job.status !== 'published') return false
  if (!job.valid_through) return false
  return job.valid_through.slice(0, 10) >= toIsoDate(now)
}

export function jobLocation(job: Pick<Job, 'location_override'>, employer: Pick<Employer, 'address_street' | 'address_zip' | 'address_city'>) {
  const o = job.location_override
  if (o && o.street && o.zip && o.city) return { street: o.street, zip: o.zip, city: o.city }
  return { street: employer.address_street, zip: employer.address_zip, city: employer.address_city }
}

const fmt = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const num = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
export function salaryText(job: Pick<Job, 'salary_min' | 'salary_max' | 'salary_unit'>): string | null {
  const min = num(job.salary_min)
  if (min === null) return null
  const max = num(job.salary_max)
  const unit = job.salary_unit === 'HOUR' ? 'pro Stunde' : 'pro Monat'
  const f = (n: number) => (Number.isInteger(n) ? fmt.format(n) : n.toFixed(2).replace('.', ','))
  return max !== null && max > min ? `${f(min)} – ${f(max)} € ${unit}` : `ab ${f(min)} € ${unit}`
}

export function jobBenefits(job: Pick<Job, 'benefits_override'>, employer: Pick<Employer, 'benefits'>): Benefit[] {
  if (job.benefits_override && job.benefits_override.length) return job.benefits_override
  return employer.benefits ?? []
}

export function jobPath(slug: string): string {
  return `/jobs/${slug}`
}
```

- [ ] **Step 4: Test grün**

Run: `yarn test`
Expected: 6 Tests PASS

- [ ] **Step 5: Commit**

```bash
git add shared/utils/jobs.ts tests/unit/jobs.test.ts
git commit -m "Domänen-Helfer für Stellen: Sichtbarkeit, Einsatzort, Gehalt, Benefits

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: JobPosting-Builder `shared/utils/buildJobPosting.ts`

**Files:**
- Create: `shared/utils/buildJobPosting.ts`
- Test: `tests/unit/buildJobPosting.test.ts`

**Interfaces:**
- Consumes: `Job`, `Employer`, `jobLocation`, `salaryText` aus Task 3.
- Produces: `buildJobPosting(input: { job: Job; employer: Employer; siteUrl: string; logoUrl?: string | null }): Record<string, any>` – reines JSON-LD-Objekt mit `@type: 'JobPosting'`, `@id: <url>#jobposting`. Wird von Stellenseite (Task 9), Google-Vorschau (Task 12) und Prüfbericht (Task 13) genutzt.

- [ ] **Step 1: Test**

```ts
// tests/unit/buildJobPosting.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildJobPosting } from '../../shared/utils/buildJobPosting.ts'

const employer = {
  id: 'e1', status: 'published', name: 'Pflegedienst Sonnenhof', slug: 'sonnenhof', legal_name: 'Sonnenhof Pflege GmbH', website: 'https://sonnenhof.example',
  address_street: 'Bornaische Straße 12', address_zip: '04277', address_city: 'Leipzig', apply_email: 'demo@example.com',
} as any
const job = {
  id: 'j1', status: 'published', employer, title: 'Pflegefachkraft (m/w/d)', slug: 'pflegefachkraft', employment_types: ['FULL_TIME', 'PART_TIME'],
  intro: 'Wir suchen dich.', tasks: '<ul><li>Grundpflege</li></ul>', requirements: '<p>Examen</p>',
  salary_min: 3400, salary_max: 3900, salary_unit: 'MONTH', date_posted: '2026-10-01', valid_through: '2026-11-30',
} as any

test('baut ein vollständiges JobPosting', () => {
  const e = buildJobPosting({ job, employer, siteUrl: 'https://jobs.example', logoUrl: 'https://cms.example/assets/logo' })
  assert.equal(e['@type'], 'JobPosting')
  assert.equal(e['@id'], 'https://jobs.example/jobs/pflegefachkraft#jobposting')
  assert.equal(e.url, 'https://jobs.example/jobs/pflegefachkraft')
  assert.equal(e.title, 'Pflegefachkraft (m/w/d)')
  assert.equal(e.datePosted, '2026-10-01')
  assert.equal(e.validThrough, '2026-11-30')
  assert.deepEqual(e.employmentType, ['FULL_TIME', 'PART_TIME'])
  assert.equal(e.directApply, true)
  assert.deepEqual(e.hiringOrganization, { '@type': 'Organization', name: 'Sonnenhof Pflege GmbH', sameAs: 'https://sonnenhof.example', logo: 'https://cms.example/assets/logo' })
  assert.deepEqual(e.jobLocation, { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: 'Bornaische Straße 12', postalCode: '04277', addressLocality: 'Leipzig', addressCountry: 'DE' } })
  assert.deepEqual(e.baseSalary, { '@type': 'MonetaryAmount', currency: 'EUR', value: { '@type': 'QuantitativeValue', minValue: 3400, maxValue: 3900, unitText: 'MONTH' } })
  assert.deepEqual(e.identifier, { '@type': 'PropertyValue', name: 'Pflegedienst Sonnenhof', value: 'j1' })
  assert.match(e.description, /Wir suchen dich\./)
  assert.match(e.description, /Grundpflege/)
})

test('ohne Gehalt kein baseSalary, nur Mindestwert ohne maxValue', () => {
  const ohne = buildJobPosting({ job: { ...job, salary_min: null, salary_max: 3900 }, employer, siteUrl: 'https://jobs.example' })
  assert.equal('baseSalary' in ohne, false)
  const nurMin = buildJobPosting({ job: { ...job, salary_max: null }, employer, siteUrl: 'https://jobs.example' })
  assert.deepEqual(nurMin.baseSalary.value, { '@type': 'QuantitativeValue', minValue: 3400, unitText: 'MONTH' })
})

test('ohne legal_name und Logo: name = Dienstname, kein logo-Feld', () => {
  const e = buildJobPosting({ job, employer: { ...employer, legal_name: null, website: null }, siteUrl: 'https://jobs.example' })
  assert.deepEqual(e.hiringOrganization, { '@type': 'Organization', name: 'Pflegedienst Sonnenhof' })
})

test('leere employment_types fallen weg, siteUrl ohne doppelten Slash', () => {
  const e = buildJobPosting({ job: { ...job, employment_types: [] }, employer, siteUrl: 'https://jobs.example/' })
  assert.equal('employmentType' in e, false)
  assert.equal(e.url, 'https://jobs.example/jobs/pflegefachkraft')
})
```

- [ ] **Step 2: Test rot**

Run: `yarn test`
Expected: FAIL „Cannot find module … buildJobPosting.ts“

- [ ] **Step 3: Implementierung**

```ts
// shared/utils/buildJobPosting.ts
// Erzeugt das JobPosting-JSON-LD für Google aus Dienst + Stelle. Eine Quelle für Stellenseite, Google-Vorschau und Prüfbericht.
import type { Employer, Job } from './jobs'
import { jobLocation, jobPath } from './jobs'

export interface JobPostingInput {
  job: Job
  employer: Employer
  siteUrl: string
  logoUrl?: string | null
}

const stripTags = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export function jobDescriptionHtml(job: Pick<Job, 'intro' | 'tasks' | 'requirements'>): string {
  const parts: string[] = []
  if (job.intro) parts.push(`<p>${job.intro}</p>`)
  if (job.tasks) parts.push(`<h2>Aufgaben</h2>${job.tasks}`)
  if (job.requirements) parts.push(`<h2>Voraussetzungen</h2>${job.requirements}`)
  return parts.join('\n')
}

export function buildJobPosting({ job, employer, siteUrl, logoUrl }: JobPostingInput): Record<string, any> {
  const base = (siteUrl || '').replace(/\/+$/, '')
  const url = `${base}${jobPath(job.slug)}`
  const loc = jobLocation(job, employer)

  const hiringOrganization: Record<string, any> = { '@type': 'Organization', name: employer.legal_name || employer.name }
  if (employer.website) hiringOrganization.sameAs = employer.website
  if (logoUrl) hiringOrganization.logo = logoUrl

  const entity: Record<string, any> = {
    '@type': 'JobPosting',
    '@id': `${url}#jobposting`,
    url,
    title: job.title,
    description: jobDescriptionHtml(job) || stripTags(job.title),
    datePosted: job.date_posted,
    validThrough: job.valid_through,
    hiringOrganization,
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', streetAddress: loc.street, postalCode: loc.zip, addressLocality: loc.city, addressCountry: 'DE' },
    },
    identifier: { '@type': 'PropertyValue', name: employer.name, value: job.id },
    directApply: true,
  }
  if (job.employment_types && job.employment_types.length) entity.employmentType = job.employment_types

  const min = toNumber(job.salary_min)
  if (min !== null) {
    const value: Record<string, any> = { '@type': 'QuantitativeValue', minValue: min, unitText: job.salary_unit === 'HOUR' ? 'HOUR' : 'MONTH' }
    const max = toNumber(job.salary_max)
    if (max !== null && max > min) value.maxValue = max
    entity.baseSalary = { '@type': 'MonetaryAmount', currency: 'EUR', value }
  }
  return entity
}

function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
```
Hinweis zur Reihenfolge der Keys in `value`: Der Test vergleicht `deepEqual`, das ignoriert die Key-Reihenfolge, aber `maxValue` muss nach `minValue` eingefügt werden, so wie oben.

- [ ] **Step 4: Test grün**

Run: `yarn test`
Expected: alle Tests PASS

- [ ] **Step 5: Commit**

```bash
git add shared/utils/buildJobPosting.ts tests/unit/buildJobPosting.test.ts
git commit -m "JobPosting-Builder für Google aus Dienst und Stelle

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Prüfbericht-Logik `shared/utils/jobPostingCheck.ts`

**Files:**
- Create: `shared/utils/jobPostingCheck.ts`
- Test: `tests/unit/jobPostingCheck.test.ts`

**Interfaces:**
- Consumes: JobPosting-Objekt aus Task 4.
- Produces: `checkJobPosting(entity: Record<string, any>): { ok: boolean; required: CheckItem[]; recommended: CheckItem[] }` mit `CheckItem = { key: string; label: string; ok: boolean }`.

- [ ] **Step 1: Test**

```ts
// tests/unit/jobPostingCheck.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkJobPosting } from '../../shared/utils/jobPostingCheck.ts'

const full = {
  '@type': 'JobPosting', title: 'Pflegefachkraft', description: '<p>x</p>', datePosted: '2026-10-01', validThrough: '2026-11-30',
  hiringOrganization: { '@type': 'Organization', name: 'Sonnenhof', logo: 'https://x/logo' },
  jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: 'A 1', postalCode: '04277', addressLocality: 'Leipzig', addressCountry: 'DE' } },
  baseSalary: { '@type': 'MonetaryAmount' }, employmentType: ['FULL_TIME'], identifier: { '@type': 'PropertyValue', value: 'j1' }, directApply: true,
}

test('vollständiges Posting: ok, alle Pflicht- und Empfehlungsfelder grün', () => {
  const r = checkJobPosting(full)
  assert.equal(r.ok, true)
  assert.equal(r.required.every((i) => i.ok), true)
  assert.equal(r.recommended.every((i) => i.ok), true)
  assert.equal(r.required.length, 8)
  assert.equal(r.recommended.length, 5)
})

test('fehlende Straße macht ok=false und markiert nur dieses Pflichtfeld', () => {
  const r = checkJobPosting({ ...full, jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', postalCode: '04277', addressLocality: 'Leipzig', addressCountry: 'DE' } } })
  assert.equal(r.ok, false)
  assert.deepEqual(r.required.filter((i) => !i.ok).map((i) => i.key), ['jobLocation.address.streetAddress'])
})

test('fehlende Empfehlung lässt ok=true', () => {
  const { baseSalary, ...ohneGehalt } = full
  const r = checkJobPosting(ohneGehalt)
  assert.equal(r.ok, true)
  assert.deepEqual(r.recommended.filter((i) => !i.ok).map((i) => i.key), ['baseSalary'])
})

test('leere Strings und leere Arrays zählen als fehlend', () => {
  const r = checkJobPosting({ ...full, title: '   ', employmentType: [] })
  assert.equal(r.required.find((i) => i.key === 'title')?.ok, false)
  assert.equal(r.recommended.find((i) => i.key === 'employmentType')?.ok, false)
})
```

- [ ] **Step 2: Test rot**

Run: `yarn test`
Expected: FAIL „Cannot find module … jobPostingCheck.ts“

- [ ] **Step 3: Implementierung**

```ts
// shared/utils/jobPostingCheck.ts
// Nachbildung des Rich-Results-Tests für JobPosting: Pflichtfelder (rot) und empfohlene Felder (gelb) nach Googles Dokumentation.
export interface CheckItem { key: string; label: string; ok: boolean }
export interface JobPostingCheck { ok: boolean; required: CheckItem[]; recommended: CheckItem[] }

const REQUIRED: Array<[string, string]> = [
  ['title', 'Titel'],
  ['description', 'Beschreibung'],
  ['datePosted', 'Veröffentlicht am'],
  ['validThrough', 'Gültig bis'],
  ['hiringOrganization.name', 'Arbeitgeber'],
  ['jobLocation.address.streetAddress', 'Straße'],
  ['jobLocation.address.postalCode', 'PLZ'],
  ['jobLocation.address.addressLocality', 'Ort'],
]
const RECOMMENDED: Array<[string, string]> = [
  ['baseSalary', 'Gehalt'],
  ['employmentType', 'Beschäftigungsart'],
  ['identifier', 'Kennung'],
  ['hiringOrganization.logo', 'Logo'],
  ['directApply', 'Direktbewerbung'],
]

function get(obj: any, path: string): unknown {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
function present(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  return true
}

export function checkJobPosting(entity: Record<string, any>): JobPostingCheck {
  const required = REQUIRED.map(([key, label]) => ({ key, label, ok: present(get(entity, key)) }))
  const recommended = RECOMMENDED.map(([key, label]) => ({ key, label, ok: present(get(entity, key)) }))
  return { ok: required.every((i) => i.ok), required, recommended }
}
```

- [ ] **Step 4: Test grün**

Run: `yarn test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add shared/utils/jobPostingCheck.ts tests/unit/jobPostingCheck.test.ts
git commit -m "Prüfbericht-Logik für JobPosting (Pflicht- und Empfehlungsfelder)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Bewerbungs-Validierung `shared/utils/applicationSchema.ts`

**Files:**
- Create: `shared/utils/applicationSchema.ts`
- Test: `tests/unit/applicationSchema.test.ts`

**Interfaces:**
- Produces: `applicationSchema` (zod), `type ApplicationInput`, `normalizePhone(s: string): string`, `SOURCES = ['google','wa','qr','direct','demo'] as const`.

- [ ] **Step 1: Test**

```ts
// tests/unit/applicationSchema.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applicationSchema, normalizePhone } from '../../shared/utils/applicationSchema.ts'

const ok = { job: '2b7c1f6e-1e7a-4c0f-9f0e-0a1b2c3d4e5f', name: 'Anna Beispiel', phone: '0151 123 45 67', qualification: 'pflegefachkraft', hours_wish: 'teilzeit_30', consent: true }

test('gültige Minimalbewerbung geht durch, Defaults gesetzt', () => {
  const r = applicationSchema.safeParse(ok)
  assert.equal(r.success, true)
  if (r.success) {
    assert.equal(r.data.source, 'direct')
    assert.equal(r.data.message, '')
    assert.equal(r.data.earliest_start, '')
  }
})

test('Telefon in Alltagsschreibweisen', () => {
  for (const phone of ['0151 123 45 67', '+49 151 1234567', '0151/1234567', '0341-123456']) {
    assert.equal(applicationSchema.safeParse({ ...ok, phone }).success, true, phone)
  }
  for (const phone of ['abc', '12', '']) {
    assert.equal(applicationSchema.safeParse({ ...ok, phone }).success, false, phone)
  }
})

test('normalizePhone behält Plus und Ziffern', () => {
  assert.equal(normalizePhone('+49 151 / 123-45 67'), '+491511234567')
  assert.equal(normalizePhone('0151 1234567'), '01511234567')
})

test('Einwilligung muss true sein, Qualifikation aus der Liste, job eine UUID', () => {
  assert.equal(applicationSchema.safeParse({ ...ok, consent: false }).success, false)
  assert.equal(applicationSchema.safeParse({ ...ok, qualification: 'arzt' }).success, false)
  assert.equal(applicationSchema.safeParse({ ...ok, job: '123' }).success, false)
})

test('unbekannte Quelle fällt auf direct zurück, Nachricht max 2000 Zeichen', () => {
  const r = applicationSchema.safeParse({ ...ok, source: 'facebook' })
  assert.equal(r.success, true)
  if (r.success) assert.equal(r.data.source, 'direct')
  assert.equal(applicationSchema.safeParse({ ...ok, message: 'x'.repeat(2001) }).success, false)
})
```

- [ ] **Step 2: Test rot**

Run: `yarn test`
Expected: FAIL „Cannot find module … applicationSchema.ts“

- [ ] **Step 3: Implementierung**

```ts
// shared/utils/applicationSchema.ts
// Validierung der Kurzbewerbung – identisch im Browser (ApplyForm.vue) und auf dem Server (server/api/apply.post.ts).
import { z } from 'zod'
import { QUALIFICATION_LABELS, HOURS_WISH_LABELS } from './jobs'

export const SOURCES = ['google', 'wa', 'qr', 'direct', 'demo'] as const
export type Source = typeof SOURCES[number]

export function normalizePhone(s: string): string {
  const trimmed = s.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/\D/g, '')
}

const phoneSchema = z.string().trim().min(1, 'Bitte gib deine Telefonnummer an.').max(40)
  .refine((s) => /^[+\d][\d\s\/().-]*$/.test(s) && s.replace(/\D/g, '').length >= 6, 'Bitte gib eine gültige Telefonnummer an.')

export const applicationSchema = z.object({
  job: z.string().uuid('Stelle unbekannt.'),
  name: z.string().trim().min(2, 'Bitte gib deinen Namen an.').max(120),
  phone: phoneSchema,
  qualification: z.enum(Object.keys(QUALIFICATION_LABELS) as [keyof typeof QUALIFICATION_LABELS, ...Array<keyof typeof QUALIFICATION_LABELS>], { errorMap: () => ({ message: 'Bitte wähle deine Qualifikation.' }) }),
  hours_wish: z.enum(Object.keys(HOURS_WISH_LABELS) as [keyof typeof HOURS_WISH_LABELS, ...Array<keyof typeof HOURS_WISH_LABELS>], { errorMap: () => ({ message: 'Bitte wähle deinen Stundenwunsch.' }) }),
  earliest_start: z.string().trim().max(80).optional().default(''),
  message: z.string().trim().max(2000, 'Bitte höchstens 2000 Zeichen.').optional().default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'Bitte stimme der Kontaktaufnahme zu.' }) }),
  source: z.preprocess((v) => (SOURCES.includes(v as Source) ? v : 'direct'), z.enum(SOURCES)).default('direct'),
})

export type ApplicationInput = z.infer<typeof applicationSchema>
```

- [ ] **Step 4: Test grün**

Run: `yarn test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add shared/utils/applicationSchema.ts tests/unit/applicationSchema.test.ts
git commit -m "Validierung der Kurzbewerbung (zod), geteilt für Browser und Server

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Seed mit Demo-Dienst und zwei Stellen

**Files:**
- Create: `scripts/seed-jobs.mjs`

**Interfaces:**
- Produces: Dienst `sonnenhof-leipzig` (`is_demo: true`) mit zwei veröffentlichten Stellen `pflegefachkraft` und `pflegehilfskraft`; `valid_through` relativ zum Ausführungsdatum (+60 Tage), damit die Demo nie abläuft.

- [ ] **Step 1: Skript**

```js
// scripts/seed-jobs.mjs
// Demo-Dienst „Pflegedienst Sonnenhof Leipzig“ (fiktiv, is_demo) mit zwei Stellen. Idempotent (Dienst per slug, Stellen per employer+slug).
// Alle Namen, Adressen und Kontaktdaten sind erfunden. Aufruf: yarn directus:seed:jobs
import { upsertItem } from './lib/directus-admin.mjs';

const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plusDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

console.log('\n[1/2] Demo-Dienst');
const employer = await upsertItem('employers', { slug: 'sonnenhof-leipzig' }, {
  status: 'published',
  name: 'Pflegedienst Sonnenhof Leipzig',
  slug: 'sonnenhof-leipzig',
  legal_name: 'Sonnenhof Pflege GmbH (fiktiv)',
  color_primary: '#1d6b57',
  color_secondary: '#dcefe7',
  address_street: 'Bornaische Straße 12',
  address_zip: '04277',
  address_city: 'Leipzig',
  phone: '0341 000000',
  website: 'https://sonnenhof.example',
  apply_email: process.env.NOTIFY_BCC || 'demo@example.com',
  service_area: 'Leipzig-Süd, Connewitz, Markkleeberg, Zwenkau',
  about: 'Wir sind ein ambulanter Pflegedienst mit 38 Kolleginnen und Kollegen. Wir pflegen zu Hause, planen Touren so, dass Zeit für Menschen bleibt, und reden offen über Dienstpläne.',
  schedule_model: 'Wunschdienstplan vier Wochen im Voraus, höchstens sieben Dienste am Stück, jedes zweite Wochenende frei.',
  benefits: [
    { label: 'Gehalt nach TVöD-P', detail: 'plus Zulagen und Jahressonderzahlung' },
    { label: 'Dienstwagen auch privat', detail: 'nach der Probezeit' },
    { label: '30 Tage Urlaub' },
    { label: 'Fortbildung bezahlt', detail: 'inklusive Freistellung' },
  ],
  is_demo: true,
}, 'sonnenhof-leipzig');

console.log('\n[2/2] Stellen');
await upsertItem('jobs', { employer: { _eq: employer.id }, slug: { _eq: 'pflegefachkraft' } }, {
  status: 'published', employer: employer.id,
  title: 'Pflegefachkraft (m/w/d)', slug: 'pflegefachkraft',
  employment_types: ['FULL_TIME', 'PART_TIME'], hours_min: 20, hours_max: 39, start_note: 'ab sofort',
  salary_min: 3400, salary_max: 3900, salary_unit: 'MONTH', salary_note: 'brutto bei Vollzeit, nach TVöD-P 7, plus Zulagen',
  intro: 'Du willst pflegen, nicht hetzen? Bei uns hast du feste Touren, ein Team, das sich kennt, und einen Dienstplan, der hält.',
  tasks: '<ul><li>Grund- und Behandlungspflege in der Häuslichkeit</li><li>Pflegeplanung und Dokumentation</li><li>Beratung von Angehörigen</li><li>Zusammenarbeit mit Hausärzten</li></ul>',
  requirements: '<ul><li>Examen als Pflegefachkraft, Altenpfleger/in oder Gesundheits- und Krankenpfleger/in</li><li>Führerschein Klasse B</li><li>Freude am Umgang mit Menschen</li></ul>',
  contact_name: 'Pflegedienstleitung Frau Beispiel',
  date_posted: iso(plusDays(-3)), valid_through: iso(plusDays(60)),
}, 'pflegefachkraft');

await upsertItem('jobs', { employer: { _eq: employer.id }, slug: { _eq: 'pflegehilfskraft' } }, {
  status: 'published', employer: employer.id,
  title: 'Pflegehilfskraft (m/w/d)', slug: 'pflegehilfskraft',
  employment_types: ['PART_TIME'], hours_min: 20, hours_max: 30, start_note: 'ab sofort',
  salary_min: 2600, salary_max: 2900, salary_unit: 'MONTH', salary_note: 'brutto bei 30 Stunden',
  intro: 'Du hast ein Herz für Menschen und willst in der Pflege anfangen oder weitermachen? Wir arbeiten dich ein.',
  tasks: '<ul><li>Unterstützung bei der Grundpflege</li><li>Hauswirtschaftliche Hilfe</li><li>Begleitung im Alltag</li></ul>',
  requirements: '<ul><li>Erfahrung in der Pflege oder Pflegebasiskurs</li><li>Führerschein Klasse B</li><li>Zuverlässigkeit</li></ul>',
  contact_name: 'Pflegedienstleitung Frau Beispiel',
  date_posted: iso(plusDays(-10)), valid_through: iso(plusDays(60)),
}, 'pflegehilfskraft');

console.log('\nFertig.\n');
```
Prüfen, wie `upsertItem` in `scripts/lib/directus-admin.mjs` den Filter erwartet (einfaches `{ feld: wert }` oder Directus-Filter). Falls nur einfache Gleichheit: für Stellen `{ slug: 'pflegefachkraft' }` nutzen, da die Slugs in der Demo eindeutig sind.

- [ ] **Step 2: Zweimal laufen lassen, prüfen**

```bash
yarn directus:seed:jobs && yarn directus:seed:jobs
curl -s "http://localhost:8055/items/jobs?fields=title,slug,valid_through,employer.slug" ; echo
```
Erwartet: zwei Stellen, `employer.slug = sonnenhof-leipzig`, keine Duplikate nach dem zweiten Lauf.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-jobs.mjs
git commit -m "Seed: fiktiver Demo-Pflegedienst mit zwei Stellen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Designkonzept, `useEmployer`, Demo-Hinweis, Stellenliste

**Files:**
- Create: `docs/design-konzept.md`, `app/composables/useEmployer.ts`, `app/composables/useJobs.ts`, `app/pages/jobs/index.vue`, `app/components/jobs/JobCard.vue`, `app/components/jobs/DemoNotice.vue`
- Modify: `nuxt.config.ts`, `app/assets/css/tailwind.css`, `app/layouts/default.vue`

**Interfaces:**
- Consumes: Task 3 (`Employer`, `Job`, `salaryText`, `EMPLOYMENT_TYPE_LABELS`, `jobPath`).
- Produces:
  - `useEmployer(): Promise<{ employer: Ref<Employer | null> }>` – lädt den Dienst aus `runtimeConfig.public.employerSlug`, `useState('employer')`.
  - `JOB_LIST_FIELDS: string[]`, `JOB_DETAIL_FIELDS: string[]` und `useJobs()` → `{ jobs: Ref<Job[]> }` (nur sichtbare, Filter serverseitig + `isJobVisible` clientseitig) sowie `useJob(slug)` → `{ job: Ref<Job | null> }`.
  - `<DemoNotice />` rendert nur bei `employer.is_demo`.

- [ ] **Step 1: Designkonzept schreiben**

`docs/design-konzept.md` mit diesen Festlegungen (kurz, eine Seite):
- Zielgruppe: Pflegekräfte am Handy, in der Pause. Mobile-first, große Tippflächen (min. 48 px), Gehalt und Dienstplan typografisch hervorgehoben.
- Tokens: `--primary` aus `employer.color_primary` (Fallback `oklch(0.45 0.08 165)`), `--secondary` aus `color_secondary` (Fallback `oklch(0.95 0.02 165)`), Neutrale leicht grünstichig. Kontraste: Primärfarbe als Fläche mit weißer Schrift, Text auf Papier aus `--foreground`.
- Schrift: Inter aus dem Base-Repo bleibt (bereits geladen), Überschriften 700, Fließtext 400, Chips 600 in 0.85rem.
- Formular: ein Feld pro Zeile, Labels über dem Feld, Fehler inline unter dem Feld in `--destructive`.
- Kein Hover-Lift, keine Animationen außer Fokus-Ring.

- [ ] **Step 2: `nuxt.config.ts` erweitern**

In `runtimeConfig` ergänzen:
```ts
runtimeConfig: {
  public: {
    siteName,
    siteUrl: process.env.SITE_URL,
    directusUrl: process.env.DIRECTUS_URL,
    employerSlug: process.env.EMPLOYER_SLUG,
  },
  redirects: { cacheSeconds: 300 },
  notifyBcc: process.env.NOTIFY_BCC || '',
  mail: { host: '', port: '587', secure: false, user: '', pass: '', from: '' },
},
```
(`mail.*` wird zur Laufzeit aus `NUXT_MAIL_HOST` usw. befüllt.) In `imports.dirs` zusätzlich `'composables'` aufnehmen, falls nicht ohnehin automatisch.

- [ ] **Step 3: Composables**

```ts
// app/composables/useEmployer.ts
// Der Dienst dieser Instanz (EMPLOYER_SLUG). Einmal laden, überall nutzen; setzt Farb-Tokens als Inline-Style auf <html>.
import type { Employer } from '#shared/utils/jobs'

export const EMPLOYER_FIELDS = ['*', 'logo.id', 'logo.title']

export async function useEmployer() {
  const { public: pub } = useRuntimeConfig()
  const { getItems } = useDirectusItems()
  const employer = useState<Employer | null>('employer', () => null)
  if (!employer.value) {
    const rows = await getItems<Employer>({
      collection: 'employers',
      params: { filter: { status: { _eq: 'published' }, slug: { _eq: pub.employerSlug } }, fields: EMPLOYER_FIELDS, limit: 1 },
    }) as unknown as Employer[]
    employer.value = rows?.[0] ?? null
  }
  useHead(() => ({
    htmlAttrs: {
      style: employer.value?.color_primary
        ? `--primary:${employer.value.color_primary};--secondary:${employer.value.color_secondary || ''}`
        : undefined,
    },
  }))
  return { employer }
}
```

```ts
// app/composables/useJobs.ts
// Stellen des Dienstes: Liste (nur sichtbare) und Einzelstelle per Slug. Der Server filtert bereits, isJobVisible ist die zweite Sicherung.
import type { Job } from '#shared/utils/jobs'
import { isJobVisible, toIsoDate } from '#shared/utils/jobs'

export const JOB_LIST_FIELDS = ['id', 'status', 'title', 'slug', 'employment_types', 'hours_min', 'hours_max', 'start_note', 'salary_min', 'salary_max', 'salary_unit', 'location_override', 'date_posted', 'valid_through']
export const JOB_DETAIL_FIELDS = ['*', 'employer.*', 'employer.logo.id', 'employer.logo.title']

function baseFilter(employerSlug: string) {
  return { status: { _eq: 'published' }, valid_through: { _gte: toIsoDate(new Date()) }, employer: { slug: { _eq: employerSlug } } }
}

export function useJobs() {
  const { public: pub } = useRuntimeConfig()
  const { getItems } = useDirectusItems()
  return useAsyncData('jobs', () => getItems<Job>({
    collection: 'jobs',
    params: { filter: baseFilter(pub.employerSlug as string), fields: JOB_LIST_FIELDS, sort: ['-date_posted'], limit: -1 },
  }) as unknown as Promise<Job[]>, { transform: (rows) => (rows ?? []).filter((j) => isJobVisible(j)) })
}

export function useJob(slug: string) {
  const { public: pub } = useRuntimeConfig()
  const { getItems } = useDirectusItems()
  return useAsyncData(`job:${slug}`, () => getItems<Job>({
    collection: 'jobs',
    params: { filter: { ...baseFilter(pub.employerSlug as string), slug: { _eq: slug } }, fields: JOB_DETAIL_FIELDS, limit: 1 },
  }) as unknown as Promise<Job[]>, { transform: (rows) => { const j = rows?.[0] ?? null; return j && isJobVisible(j) ? j : null } })
}
```

- [ ] **Step 4: Komponenten und Liste**

```vue
<!-- app/components/jobs/DemoNotice.vue -->
<template>
  <p v-if="employer?.is_demo" class="bg-secondary text-foreground text-sm text-center px-4 py-2" role="note">
    Demo-Daten, fiktiver Pflegedienst
  </p>
</template>
<script setup lang="ts">
const { employer } = await useEmployer()
</script>
```

```vue
<!-- app/components/jobs/JobCard.vue -->
<template>
  <NuxtLink :to="jobPath(job.slug)" class="block rounded-xl border border-border bg-background p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <h2 class="text-xl font-bold text-balance">{{ job.title }}</h2>
    <ul class="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
      <li v-for="t in job.employment_types ?? []" :key="t" class="rounded-full bg-secondary px-3 py-1">{{ EMPLOYMENT_TYPE_LABELS[t] }}</li>
      <li v-if="job.hours_min || job.hours_max" class="rounded-full bg-secondary px-3 py-1">{{ hoursLabel }}</li>
      <li v-if="job.start_note" class="rounded-full bg-secondary px-3 py-1">{{ job.start_note }}</li>
    </ul>
    <p v-if="salary" class="mt-3 text-lg font-bold">{{ salary }}</p>
    <p class="mt-1 text-sm text-muted-foreground">{{ location.zip }} {{ location.city }}</p>
  </NuxtLink>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, jobPath, salaryText } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer }>()
const salary = computed(() => salaryText(props.job))
const location = computed(() => jobLocation(props.job, props.employer))
const hoursLabel = computed(() => props.job.hours_min && props.job.hours_max && props.job.hours_min !== props.job.hours_max
  ? `${props.job.hours_min}–${props.job.hours_max} Std./Woche`
  : `${props.job.hours_max || props.job.hours_min} Std./Woche`)
</script>
```

```vue
<!-- app/pages/jobs/index.vue -->
<template>
  <div>
    <JobsDemoNotice />
    <BlockSection background="white" padding-bottom labelledby="jobs-heading">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-8">
        <p v-if="employer?.service_area" class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{{ employer.service_area }}</p>
        <h1 id="jobs-heading" class="mt-2 text-4xl font-extrabold tracking-tight text-balance">Offene Stellen bei {{ employer?.name }}</h1>
        <p v-if="employer?.about" class="mt-4 text-lg text-muted-foreground">{{ employer.about }}</p>
        <ul v-if="jobs?.length" class="mt-8 grid gap-4">
          <li v-for="job in jobs" :key="job.id"><JobsJobCard :job="job" :employer="employer!" /></li>
        </ul>
        <p v-else class="mt-8 text-muted-foreground">Gerade ist keine Stelle offen. Schauen Sie bald wieder vorbei.</p>
      </div>
    </BlockSection>
  </div>
</template>
<script setup lang="ts">
const { employer } = await useEmployer()
if (!employer.value) throw createError({ statusCode: 503, statusMessage: 'Dienst nicht konfiguriert', fatal: true })
const { data: jobs } = await useJobs()
useGenericPageSchema({ title: 'Offene Stellen' })
useSeoMeta({
  title: () => `Offene Stellen – ${employer.value?.name}`,
  description: () => `Jobs in der Pflege bei ${employer.value?.name}: ${employer.value?.service_area ?? ''}. Bewerbung in einer Minute vom Handy.`,
})
</script>
```

In `app/layouts/default.vue` direkt nach `<WebsiteHeader />` die Zeile `<JobsDemoNotice />` einfügen.

- [ ] **Step 5: Prüfen**

```bash
yarn dev
```
Erwartet: `http://localhost:3000/jobs` zeigt den Demo-Hinweis, den Dienstnamen und zwei Karten mit Gehalt „3.400 – 3.900 € pro Monat“ bzw. „2.600 – 2.900 € pro Monat“. Typecheck: `npx vue-tsc --noEmit -p .nuxt/tsconfig.json` ohne neue Fehler.

- [ ] **Step 6: Commit**

```bash
git add docs/design-konzept.md nuxt.config.ts app/composables/useEmployer.ts app/composables/useJobs.ts app/pages/jobs/index.vue app/components/jobs app/layouts/default.vue app/assets/css/tailwind.css
git commit -m "Dienst laden, Demo-Hinweis, Stellenliste unter /jobs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Stellenseite `/jobs/[slug]` mit JSON-LD und 404

**Files:**
- Create: `app/pages/jobs/[slug]/index.vue`, `app/components/jobs/JobHeader.vue`, `app/components/jobs/JobBenefits.vue`

**Interfaces:**
- Consumes: `useEmployer`, `useJob`, `buildJobPosting`, `useSchemaRegistry`, `sanitizeHtml`.
- Produces: `useState('jobposting:current')` mit dem JobPosting-Objekt (liest Task 13); Platzhalter-Slots `<JobsApplyForm>` (Task 10) und `<JobsShareBox>` (Task 11) werden hier bereits eingebunden, aber erst in den Folgetasks erstellt – deshalb in diesem Task als leere Komponenten anlegen.

- [ ] **Step 1: Leere Platzhalter**

`app/components/jobs/ApplyForm.vue` und `app/components/jobs/ShareBox.vue` jeweils:
```vue
<template><div /></template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
defineProps<{ job: Job; employer: Employer }>()
</script>
```

- [ ] **Step 2: Komponenten**

```vue
<!-- app/components/jobs/JobHeader.vue -->
<template>
  <header class="grid gap-4">
    <div class="flex items-center gap-3">
      <img v-if="logoSrc" :src="logoSrc" :alt="employer.name" width="56" height="56" class="h-14 w-14 rounded-lg object-contain bg-white">
      <p class="text-sm font-semibold text-muted-foreground">{{ employer.name }}</p>
    </div>
    <h1 :id="headingId" class="text-4xl font-extrabold tracking-tight text-balance">{{ job.title }}</h1>
    <ul class="flex flex-wrap gap-2 text-sm font-semibold">
      <li v-for="t in job.employment_types ?? []" :key="t" class="rounded-full bg-secondary px-3 py-1">{{ EMPLOYMENT_TYPE_LABELS[t] }}</li>
      <li v-if="hours" class="rounded-full bg-secondary px-3 py-1">{{ hours }}</li>
      <li v-if="job.start_note" class="rounded-full bg-secondary px-3 py-1">{{ job.start_note }}</li>
    </ul>
    <p class="text-muted-foreground">{{ location.street }}, {{ location.zip }} {{ location.city }}<span v-if="employer.service_area"> · Einsatz: {{ employer.service_area }}</span></p>
    <div v-if="salary" class="rounded-xl bg-primary px-5 py-4 text-primary-foreground">
      <p class="text-2xl font-extrabold">{{ salary }}</p>
      <p v-if="job.salary_note" class="text-sm opacity-90">{{ job.salary_note }}</p>
    </div>
  </header>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, salaryText } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer; headingId: string }>()
const { public: pub } = useRuntimeConfig()
const salary = computed(() => salaryText(props.job))
const location = computed(() => jobLocation(props.job, props.employer))
const hours = computed(() => props.job.hours_min || props.job.hours_max
  ? (props.job.hours_min && props.job.hours_max && props.job.hours_min !== props.job.hours_max ? `${props.job.hours_min}–${props.job.hours_max} Std./Woche` : `${props.job.hours_max || props.job.hours_min} Std./Woche`)
  : '')
const logoSrc = computed(() => {
  const logo = props.employer.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}?width=112&height=112&fit=contain&format=auto` : ''
})
</script>
```

```vue
<!-- app/components/jobs/JobBenefits.vue -->
<template>
  <section v-if="benefits.length || employer.schedule_model" aria-labelledby="benefits-heading" class="grid gap-4">
    <h2 id="benefits-heading" class="text-2xl font-bold">So arbeiten wir</h2>
    <p v-if="employer.schedule_model" class="rounded-xl border border-border p-4"><span class="font-semibold">Dienstplan:</span> {{ employer.schedule_model }}</p>
    <ul v-if="benefits.length" class="grid gap-2 sm:grid-cols-2">
      <li v-for="b in benefits" :key="b.label" class="rounded-xl bg-secondary p-4">
        <p class="font-semibold">{{ b.label }}</p>
        <p v-if="b.detail" class="text-sm text-muted-foreground">{{ b.detail }}</p>
      </li>
    </ul>
    <p v-if="job.contact_name" class="text-muted-foreground">Ansprechperson: {{ job.contact_name }}<span v-if="employer.phone"> · {{ employer.phone }}</span></p>
  </section>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { jobBenefits } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer }>()
const benefits = computed(() => jobBenefits(props.job, props.employer))
</script>
```

- [ ] **Step 3: Seite**

```vue
<!-- app/pages/jobs/[slug]/index.vue -->
<template>
  <div v-if="job && employer">
    <BlockSection background="white" padding-bottom :labelledby="headingId">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-8 grid gap-10">
        <JobsJobHeader :job="job" :employer="employer" :heading-id="headingId" />

        <a href="#bewerben" class="fixed inset-x-4 bottom-4 z-40 rounded-full bg-primary py-4 text-center text-lg font-bold text-primary-foreground shadow-lg md:hidden">Jetzt bewerben</a>

        <section class="grid gap-6 prose-job">
          <p v-if="job.intro" class="text-lg">{{ job.intro }}</p>
          <div v-if="job.tasks"><h2 class="text-2xl font-bold mb-3">Aufgaben</h2><div class="space-y-2" v-html="sanitizeHtml(job.tasks)" /></div>
          <div v-if="job.requirements"><h2 class="text-2xl font-bold mb-3">Voraussetzungen</h2><div class="space-y-2" v-html="sanitizeHtml(job.requirements)" /></div>
          <p v-if="employer.about" class="text-muted-foreground">{{ employer.about }}</p>
        </section>

        <JobsJobBenefits :job="job" :employer="employer" />

        <section id="bewerben" aria-labelledby="apply-heading" class="scroll-mt-24 grid gap-4">
          <h2 id="apply-heading" class="text-2xl font-bold">In einer Minute bewerben</h2>
          <p class="text-muted-foreground">Kein Lebenslauf, kein Anschreiben. {{ employer.name }} ruft dich innerhalb von 24 Stunden zurück.</p>
          <JobsApplyForm :job="job" :employer="employer" />
        </section>

        <JobsShareBox :job="job" :employer="employer" />
      </div>
    </BlockSection>
  </div>
</template>

<script setup lang="ts">
import { buildJobPosting } from '#shared/utils/buildJobPosting'

const route = useRoute()
const { public: pub } = useRuntimeConfig()
const headingId = 'job-heading'
const slug = route.params.slug as string

const { employer } = await useEmployer()
if (!employer.value) throw createError({ statusCode: 503, statusMessage: 'Dienst nicht konfiguriert', fatal: true })

const { data: job } = await useJob(slug)
if (!job.value) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar', fatal: true })

const logoUrl = computed(() => {
  const logo = employer.value?.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}` : null
})
const posting = computed(() => job.value && employer.value
  ? buildJobPosting({ job: job.value, employer: employer.value, siteUrl: pub.siteUrl as string, logoUrl: logoUrl.value })
  : null)

// Für den Prüfbericht in der DevToolbar
const current = useState<Record<string, any> | null>('jobposting:current', () => null)
watchEffect(() => { current.value = posting.value })
onUnmounted(() => { current.value = null })

const registry = useSchemaRegistry()
watchEffect(() => { if (posting.value) registry.add(posting.value) })
useGenericPageSchema(computed(() => ({ title: job.value?.title })))

const description = computed(() => job.value?.intro || `${job.value?.title} bei ${employer.value?.name} in ${employer.value?.address_city}. Bewerbung in einer Minute vom Handy.`)
useSeoMeta({
  title: () => `${job.value?.title} – ${employer.value?.name}`,
  description: () => description.value,
  ogTitle: () => `${job.value?.title} – ${employer.value?.name}`,
  ogDescription: () => description.value,
  ogUrl: () => pub.siteUrl + route.path,
  robots: 'index, follow',
})
</script>
```
Im Base-Repo prüfen, wie `error.vue` den 404 rendert; der Fehlertext „Diese Stelle ist nicht mehr verfügbar“ soll dort erscheinen, mit Link auf `/jobs`. Falls `error.vue` fehlt, `app/error.vue` anlegen:
```vue
<template>
  <NuxtLayout>
    <div class="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 class="text-3xl font-bold">{{ error?.statusCode === 404 ? 'Diese Stelle ist nicht mehr verfügbar' : 'Da ist etwas schiefgelaufen' }}</h1>
      <p class="mt-4 text-muted-foreground">{{ error?.statusCode === 404 ? 'Vielleicht ist sie schon besetzt. Alle offenen Stellen finden Sie hier:' : 'Bitte versuchen Sie es gleich noch einmal.' }}</p>
      <NuxtLink to="/jobs" class="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground" @click="clearError()">Offene Stellen</NuxtLink>
    </div>
  </NuxtLayout>
</template>
<script setup lang="ts">
defineProps<{ error: { statusCode?: number } }>()
</script>
```
Im `<style>` der Seite (oder `tailwind.css`) für `.prose-job ul` Listenpunkte sichtbar machen: `.prose-job ul { list-style: disc; padding-left: 1.25rem; }`.

- [ ] **Step 4: Prüfen**

```bash
curl -s http://localhost:3000/jobs/pflegefachkraft | grep -o '"@type":"JobPosting"' 
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/jobs/gibt-es-nicht
```
Erwartet: erste Ausgabe `"@type":"JobPosting"`, zweite `404`. Im Browser: Gehaltskasten, Chips, Aufgaben als Liste, Sticky-Button mobil. JSON-LD aus dem Quelltext in `https://search.google.com/test/rich-results` als Code einfügen: „Stellenausschreibung: 1 gültiges Element“, Warnungen nur zu Empfehlungen.

- [ ] **Step 5: Commit**

```bash
git add app/pages/jobs app/components/jobs app/error.vue app/assets/css/tailwind.css
git commit -m "Stellenseite mit JobPosting-Markup und 404 für unsichtbare Stellen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Kurzbewerbung: Formular, `/api/apply`, Benachrichtigung, Mailvorschau

**Files:**
- Create: `server/utils/rateLimit.ts`, `server/utils/notify.ts`, `server/api/apply.post.ts`, `server/routes/__mail/[id].get.ts`
- Modify: `app/components/jobs/ApplyForm.vue`
- Test: `tests/unit/rateLimit.test.ts`, `tests/unit/notify.test.ts`

**Interfaces:**
- Consumes: `applicationSchema`, `normalizePhone`, `SOURCES` (Task 6); `isJobVisible` (Task 3); `QUALIFICATION_LABELS`, `HOURS_WISH_LABELS`.
- Produces:
  - `createRateLimiter({ limit, windowMs })` → `{ check(key: string, now?: number): boolean }` (true = erlaubt).
  - `renderApplicationMail(input): { subject: string; text: string; html: string }` (rein, testbar) in `server/utils/notify.ts`, dazu `notifyApplication(...)` mit Versand oder Vorschau-Datei.
  - `POST /api/apply` Body = `ApplicationInput & { website?: string }`, Antwort `{ ok: true, previewId?: string }`.

- [ ] **Step 1: Tests**

```ts
// tests/unit/rateLimit.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimiter } from '../../server/utils/rateLimit.ts'

test('erlaubt limit Anfragen im Fenster, danach nicht, nach Ablauf wieder', () => {
  const rl = createRateLimiter({ limit: 2, windowMs: 1000 })
  assert.equal(rl.check('a', 0), true)
  assert.equal(rl.check('a', 10), true)
  assert.equal(rl.check('a', 20), false)
  assert.equal(rl.check('b', 20), true)
  assert.equal(rl.check('a', 1001), true)
})
```

```ts
// tests/unit/notify.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderApplicationMail } from '../../server/utils/notify.ts'

test('Mail enthält die vier Angaben, Quelle und Link zur Stelle', () => {
  const m = renderApplicationMail({
    employerName: 'Sonnenhof', jobTitle: 'Pflegefachkraft (m/w/d)', jobUrl: 'https://jobs.example/jobs/pflegefachkraft',
    name: 'Anna Beispiel', phone: '+491511234567', qualification: 'pflegefachkraft', hoursWish: 'teilzeit_30', earliestStart: 'ab Januar', message: '', source: 'wa',
    createdAt: new Date(2026, 9, 2, 14, 30),
  })
  assert.equal(m.subject, 'Neue Bewerbung: Pflegefachkraft (m/w/d) – Anna Beispiel')
  assert.match(m.text, /Anna Beispiel/)
  assert.match(m.text, /\+491511234567/)
  assert.match(m.text, /Pflegefachkraft\b/)
  assert.match(m.text, /Teilzeit, ca\. 30 Stunden/)
  assert.match(m.text, /WhatsApp/)
  assert.match(m.text, /https:\/\/jobs\.example\/jobs\/pflegefachkraft/)
  assert.match(m.html, /href="tel:\+491511234567"/)
})
```

- [ ] **Step 2: Tests rot**

Run: `yarn test`
Expected: FAIL „Cannot find module … rateLimit.ts“ bzw. „notify.ts“

- [ ] **Step 3: `rateLimit.ts` und `notify.ts`**

```ts
// server/utils/rateLimit.ts
// Einfaches In-Memory-Limit pro Schlüssel (IP). Reicht für eine Instanz; bei mehreren Instanzen später Redis.
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>()
  return {
    check(key: string, now: number = Date.now()): boolean {
      const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (list.length >= limit) { hits.set(key, list); return false }
      list.push(now)
      hits.set(key, list)
      return true
    },
  }
}
```

```ts
// server/utils/notify.ts
// Benachrichtigung des Dienstes über eine neue Bewerbung. Mit SMTP (NUXT_MAIL_*) per Nodemailer,
// sonst Log + HTML-Datei unter .data/mail-preview/<id>.html (Vorschau unter /__mail/<id> im Dev-Modus).
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import nodemailer from 'nodemailer'
import { QUALIFICATION_LABELS, HOURS_WISH_LABELS } from '#shared/utils/jobs'

const SOURCE_LABELS: Record<string, string> = { google: 'Google', wa: 'WhatsApp', qr: 'QR-Aushang', direct: 'Direkt', demo: 'Demo' }

export interface ApplicationMailInput {
  employerName: string; jobTitle: string; jobUrl: string
  name: string; phone: string; qualification: string; hoursWish: string; earliestStart: string; message: string; source: string
  createdAt: Date
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

export function renderApplicationMail(i: ApplicationMailInput) {
  const q = (QUALIFICATION_LABELS as Record<string, string>)[i.qualification] ?? i.qualification
  const h = (HOURS_WISH_LABELS as Record<string, string>)[i.hoursWish] ?? i.hoursWish
  const src = SOURCE_LABELS[i.source] ?? i.source
  const when = i.createdAt.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
  const subject = `Neue Bewerbung: ${i.jobTitle} – ${i.name}`
  const lines = [
    `Neue Bewerbung für ${i.jobTitle} (${i.employerName})`, '',
    `Name: ${i.name}`, `Telefon: ${i.phone}`, `Qualifikation: ${q}`, `Wunschstunden: ${h}`,
    i.earliestStart ? `Frühester Start: ${i.earliestStart}` : '', i.message ? `Nachricht: ${i.message}` : '', '',
    `Quelle: ${src}`, `Eingegangen: ${when}`, `Stelle: ${i.jobUrl}`, '',
    'Bitte innerhalb von 24 Stunden zurückrufen.',
  ].filter((l) => l !== '')
  const text = lines.join('\n')
  const html = `<!doctype html><html lang="de"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#15221d;padding:24px">
<h1 style="font-size:20px">Neue Bewerbung: ${esc(i.jobTitle)}</h1>
<p style="color:#5a6b64">${esc(i.employerName)} · eingegangen ${esc(when)} · Quelle: ${esc(src)}</p>
<table style="border-collapse:collapse"><tbody>
<tr><td style="padding:6px 12px 6px 0;font-weight:600">Name</td><td>${esc(i.name)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;font-weight:600">Telefon</td><td><a href="tel:${esc(i.phone)}">${esc(i.phone)}</a></td></tr>
<tr><td style="padding:6px 12px 6px 0;font-weight:600">Qualifikation</td><td>${esc(q)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;font-weight:600">Wunschstunden</td><td>${esc(h)}</td></tr>
${i.earliestStart ? `<tr><td style="padding:6px 12px 6px 0;font-weight:600">Frühester Start</td><td>${esc(i.earliestStart)}</td></tr>` : ''}
${i.message ? `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top">Nachricht</td><td>${esc(i.message)}</td></tr>` : ''}
</tbody></table>
<p style="margin-top:24px"><a href="tel:${esc(i.phone)}" style="display:inline-block;background:#1d6b57;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Jetzt zurückrufen</a></p>
<p style="color:#5a6b64;font-size:14px">Stelle: <a href="${esc(i.jobUrl)}">${esc(i.jobUrl)}</a><br>Bitte innerhalb von 24 Stunden zurückrufen.</p>
</body></html>`
  return { subject, text, html }
}

export async function notifyApplication(to: string, bcc: string, mail: ReturnType<typeof renderApplicationMail>): Promise<{ sent: boolean; previewId?: string }> {
  const { mail: cfg } = useRuntimeConfig()
  if (cfg.host) {
    const transport = nodemailer.createTransport({
      host: cfg.host, port: Number(cfg.port), secure: String(cfg.secure) === 'true',
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    })
    await transport.sendMail({ from: cfg.from || cfg.user, to, bcc: bcc || undefined, ...mail })
    return { sent: true }
  }
  const previewId = randomUUID()
  await mkdir('.data/mail-preview', { recursive: true })
  await writeFile(`.data/mail-preview/${previewId}.html`, mail.html, 'utf8')
  console.log(`[notify] Kein SMTP konfiguriert. Mail an ${to}:\n${mail.text}\nVorschau: /__mail/${previewId}`)
  return { sent: false, previewId }
}
```

- [ ] **Step 4: Tests grün**

Run: `yarn test`
Expected: PASS

- [ ] **Step 5: `/api/apply` und Mailvorschau-Route**

```ts
// server/api/apply.post.ts
// Nimmt die Kurzbewerbung an: Honeypot, Rate-Limit, Validierung, Stelle erneut prüfen, Public-Create in applications, Benachrichtigung.
import { applicationSchema, normalizePhone } from '#shared/utils/applicationSchema'
import { isJobVisible, jobPath } from '#shared/utils/jobs'
import type { Job, Employer } from '#shared/utils/jobs'
import { createRateLimiter } from '../utils/rateLimit'
import { renderApplicationMail, notifyApplication } from '../utils/notify'

const FETCH_TIMEOUT_MS = 8000
const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 })

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (body?.website) return { ok: true } // Honeypot

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!limiter.check(ip)) throw createError({ statusCode: 429, statusMessage: 'Zu viele Bewerbungen. Bitte später erneut versuchen.' })

  const parsed = applicationSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Ungültige Eingaben', data: parsed.error.flatten().fieldErrors })
  }
  const input = parsed.data

  const config = useRuntimeConfig(event)
  const directusUrl = config.public.directusUrl as string | undefined
  if (!directusUrl) throw createError({ statusCode: 503, statusMessage: 'CMS nicht konfiguriert' })

  // Stelle erneut laden: zwischen Seitenaufruf und Absenden kann sie geschlossen worden sein
  const jobRes = await $fetch<{ data: Array<Job & { employer: Employer }> }>(`${directusUrl}/items/jobs`, {
    query: { filter: { id: { _eq: input.job } }, fields: 'id,status,title,slug,valid_through,apply_email_override,employer.id,employer.name,employer.apply_email,employer.is_demo', limit: 1 },
    timeout: FETCH_TIMEOUT_MS,
  }).catch(() => ({ data: [] }))
  const job = jobRes.data?.[0]
  if (!job || !isJobVisible(job)) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar' })

  const phone = normalizePhone(input.phone)
  const source = job.employer.is_demo ? 'demo' : input.source
  const record = {
    job: job.id, employer: job.employer.id, name: input.name, phone,
    qualification: input.qualification, hours_wish: input.hours_wish, earliest_start: input.earliest_start, message: input.message,
    source, consent: true,
    user_agent: (getHeader(event, 'user-agent') || '').slice(0, 250), referrer: (getHeader(event, 'referer') || '').slice(0, 250),
  }
  try {
    await $fetch(`${directusUrl}/items/applications`, { method: 'POST', body: record, timeout: FETCH_TIMEOUT_MS })
  } catch (err: unknown) {
    console.error('Bewerbung konnte nicht gespeichert werden:', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 502, statusMessage: 'Bewerbung konnte nicht gespeichert werden' })
  }

  // Benachrichtigung: Fehler hier dürfen die Antwort nicht kippen, die Bewerbung ist gespeichert
  let previewId: string | undefined
  try {
    const mail = renderApplicationMail({
      employerName: job.employer.name, jobTitle: job.title, jobUrl: `${config.public.siteUrl}${jobPath(job.slug)}`,
      name: input.name, phone, qualification: input.qualification, hoursWish: input.hours_wish,
      earliestStart: input.earliest_start, message: input.message, source, createdAt: new Date(),
    })
    const result = await notifyApplication(job.apply_email_override || job.employer.apply_email, config.notifyBcc as string, mail)
    previewId = result.previewId
  } catch (err: unknown) {
    console.error('Benachrichtigung fehlgeschlagen:', err instanceof Error ? err.message : err)
  }
  return { ok: true, ...(import.meta.dev && previewId ? { previewId } : {}) }
})
```

```ts
// server/routes/__mail/[id].get.ts
// Nur im Dev-Modus: zeigt eine abgelegte Mailvorschau aus .data/mail-preview/<id>.html
import { readFile } from 'node:fs/promises'

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  const id = getRouterParam(event, 'id') || ''
  if (!/^[0-9a-f-]{36}$/.test(id)) throw createError({ statusCode: 404 })
  try {
    const html = await readFile(`.data/mail-preview/${id}.html`, 'utf8')
    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    return html
  } catch {
    throw createError({ statusCode: 404 })
  }
})
```

- [ ] **Step 6: Formular**

`app/components/jobs/ApplyForm.vue` ersetzen:
```vue
<template>
  <form class="grid gap-5" novalidate @submit.prevent="submit">
    <p v-if="done" class="rounded-xl bg-secondary p-5 text-lg" role="status">
      Danke, {{ form.name }}! {{ employer.name }} meldet sich innerhalb von 24 Stunden bei dir.
      <a v-if="previewId" :href="`/__mail/${previewId}`" target="_blank" class="block mt-2 text-sm underline">Mailvorschau öffnen (nur Entwicklung)</a>
    </p>
    <template v-else>
      <div class="grid gap-1">
        <label for="apply-name" class="font-semibold">Dein Name</label>
        <input id="apply-name" v-model="form.name" type="text" autocomplete="name" required class="h-12 rounded-lg border border-border px-4 text-base">
        <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
      </div>
      <div class="grid gap-1">
        <label for="apply-phone" class="font-semibold">Deine Telefonnummer</label>
        <input id="apply-phone" v-model="form.phone" type="tel" autocomplete="tel" inputmode="tel" required class="h-12 rounded-lg border border-border px-4 text-base">
        <p v-if="errors.phone" class="text-sm text-destructive">{{ errors.phone }}</p>
      </div>
      <div class="grid gap-1">
        <label for="apply-qualification" class="font-semibold">Deine Qualifikation</label>
        <select id="apply-qualification" v-model="form.qualification" required class="h-12 rounded-lg border border-border px-4 text-base bg-background">
          <option value="" disabled>Bitte wählen</option>
          <option v-for="(label, key) in QUALIFICATION_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <p v-if="errors.qualification" class="text-sm text-destructive">{{ errors.qualification }}</p>
      </div>
      <div class="grid gap-1">
        <label for="apply-hours" class="font-semibold">Wie viel möchtest du arbeiten?</label>
        <select id="apply-hours" v-model="form.hours_wish" required class="h-12 rounded-lg border border-border px-4 text-base bg-background">
          <option value="" disabled>Bitte wählen</option>
          <option v-for="(label, key) in HOURS_WISH_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <p v-if="errors.hours_wish" class="text-sm text-destructive">{{ errors.hours_wish }}</p>
      </div>
      <div class="grid gap-1">
        <label for="apply-start" class="font-semibold">Ab wann? <span class="font-normal text-muted-foreground">(optional)</span></label>
        <input id="apply-start" v-model="form.earliest_start" type="text" placeholder="z. B. ab sofort, ab Januar" class="h-12 rounded-lg border border-border px-4 text-base">
      </div>
      <div class="grid gap-1">
        <label for="apply-message" class="font-semibold">Möchtest du noch etwas sagen? <span class="font-normal text-muted-foreground">(optional)</span></label>
        <textarea id="apply-message" v-model="form.message" rows="3" class="rounded-lg border border-border px-4 py-3 text-base" />
        <p v-if="errors.message" class="text-sm text-destructive">{{ errors.message }}</p>
      </div>
      <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hidden">
      <label class="flex items-start gap-3 text-sm">
        <input id="apply-consent" v-model="form.consent" type="checkbox" class="mt-1 h-5 w-5">
        <span>{{ employer.name }} darf mich zu dieser Bewerbung anrufen oder anschreiben. Mehr dazu in der <NuxtLink to="/datenschutz" class="underline">Datenschutzerklärung</NuxtLink>.</span>
      </label>
      <p v-if="errors.consent" class="text-sm text-destructive -mt-3">{{ errors.consent }}</p>
      <p v-if="errors._form" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{{ errors._form }}</p>
      <button type="submit" :disabled="busy" class="h-14 rounded-full bg-primary text-lg font-bold text-primary-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {{ busy ? 'Wird gesendet …' : 'Rückruf anfordern' }}
      </button>
    </template>
  </form>
</template>

<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { QUALIFICATION_LABELS, HOURS_WISH_LABELS } from '#shared/utils/jobs'
import { applicationSchema, SOURCES } from '#shared/utils/applicationSchema'

const props = defineProps<{ job: Job; employer: Employer }>()
const route = useRoute()

const form = reactive({ name: '', phone: '', qualification: '', hours_wish: '', earliest_start: '', message: '', consent: false, website: '' })
const errors = reactive<Record<string, string>>({})
const busy = ref(false)
const done = ref(false)
const previewId = ref<string | null>(null)

const source = computed(() => {
  const s = String(route.query.src ?? '')
  return (SOURCES as readonly string[]).includes(s) ? s : 'direct'
})

async function submit() {
  for (const k of Object.keys(errors)) delete errors[k]
  const payload = { job: props.job.id, ...form, source: source.value }
  const parsed = applicationSchema.safeParse(payload)
  if (!parsed.success) {
    for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) errors[k] = v?.[0] ?? 'Bitte prüfen.'
    return
  }
  busy.value = true
  try {
    const res = await $fetch<{ ok: boolean; previewId?: string }>('/api/apply', { method: 'POST', body: { ...parsed.data, website: form.website } })
    previewId.value = res.previewId ?? null
    done.value = true
  } catch (err: any) {
    const data = err?.data?.data
    if (err?.statusCode === 422 && data) for (const [k, v] of Object.entries(data)) errors[k] = (v as string[])?.[0] ?? 'Bitte prüfen.'
    else if (err?.statusCode === 404) errors._form = 'Diese Stelle ist inzwischen nicht mehr verfügbar.'
    else if (err?.statusCode === 429) errors._form = 'Zu viele Bewerbungen von diesem Anschluss. Bitte später erneut versuchen.'
    else errors._form = `Gerade nicht möglich. Bitte rufen Sie an: ${props.employer.phone || props.employer.apply_email}`
  } finally {
    busy.value = false
  }
}
</script>
```

- [ ] **Step 7: Manuell prüfen**

1. `http://localhost:3000/jobs/pflegefachkraft?src=wa` öffnen, Formular ohne Angaben absenden: Fehler erscheinen inline.
2. Formular korrekt ausfüllen, absenden: Dankestext mit Link „Mailvorschau öffnen“; Vorschau zeigt die Angaben; im Dev-Log steht die Mail; in Directus liegt die Bewerbung mit `source = demo` (weil Demo-Dienst).
3. Review-Focus 3: In Directus die Stelle auf `filled` setzen, die noch offene Stellenseite im Browser erneut absenden: Fehlermeldung „inzwischen nicht mehr verfügbar“, keine neue Bewerbung in Directus. Stelle wieder auf `published`.
4. Sechsmal hintereinander absenden: beim sechsten Mal die 429-Meldung.

- [ ] **Step 8: Commit**

```bash
git add server/utils/rateLimit.ts server/utils/notify.ts server/api/apply.post.ts server/routes/__mail app/components/jobs/ApplyForm.vue tests/unit/rateLimit.test.ts tests/unit/notify.test.ts
git commit -m "Kurzbewerbung: Formular, /api/apply mit Rate-Limit, Benachrichtigung mit Mailvorschau

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Teilen-Bereich, QR-Code, Aushang

**Files:**
- Create: `server/api/qr/[slug].get.ts`, `app/pages/jobs/[slug]/aushang.vue`, `app/layouts/bare.vue`, `shared/utils/share.ts`
- Modify: `app/components/jobs/ShareBox.vue`
- Test: `tests/unit/share.test.ts`

**Interfaces:**
- Produces: `shareLinks({ siteUrl, slug, title, employerName })` → `{ url, whatsappText, whatsappHref, qrTargetUrl, qrImagePath }`; `GET /api/qr/<slug>` liefert `image/svg+xml`; `/jobs/<slug>/aushang` druckbar, `noindex`, Layout `bare` (kein Header/Footer).

- [ ] **Step 1: Test**

```ts
// tests/unit/share.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shareLinks } from '../../shared/utils/share.ts'

test('baut Links mit Quelle und WhatsApp-Text', () => {
  const s = shareLinks({ siteUrl: 'https://jobs.example/', slug: 'pflegefachkraft', title: 'Pflegefachkraft (m/w/d)', employerName: 'Sonnenhof' })
  assert.equal(s.url, 'https://jobs.example/jobs/pflegefachkraft')
  assert.equal(s.qrTargetUrl, 'https://jobs.example/jobs/pflegefachkraft?src=qr')
  assert.equal(s.qrImagePath, '/api/qr/pflegefachkraft')
  assert.equal(s.whatsappText, 'Sonnenhof sucht: Pflegefachkraft (m/w/d). Bewerbung in einer Minute vom Handy: https://jobs.example/jobs/pflegefachkraft?src=wa')
  assert.equal(s.whatsappHref, `https://wa.me/?text=${encodeURIComponent(s.whatsappText)}`)
})
```

- [ ] **Step 2: Test rot**

Run: `yarn test`
Expected: FAIL „Cannot find module … share.ts“

- [ ] **Step 3: `share.ts`**

```ts
// shared/utils/share.ts
// Teilen-Links einer Stelle. Jede Quelle trägt ?src=, damit die Bewerbung weiß, woher sie kam.
import { jobPath } from './jobs'

export function shareLinks(i: { siteUrl: string; slug: string; title: string; employerName: string }) {
  const base = (i.siteUrl || '').replace(/\/+$/, '')
  const url = `${base}${jobPath(i.slug)}`
  const whatsappText = `${i.employerName} sucht: ${i.title}. Bewerbung in einer Minute vom Handy: ${url}?src=wa`
  return {
    url,
    qrTargetUrl: `${url}?src=qr`,
    qrImagePath: `/api/qr/${i.slug}`,
    whatsappText,
    whatsappHref: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
  }
}
```

- [ ] **Step 4: Test grün**

Run: `yarn test`
Expected: PASS

- [ ] **Step 5: QR-Route, Layout, ShareBox, Aushang**

```ts
// server/api/qr/[slug].get.ts
// QR-Code als SVG für eine Stellenseite, Ziel mit ?src=qr. Keine Prüfung der Stelle nötig: der Code zeigt nur auf eine URL.
import QRCode from 'qrcode'
import { shareLinks } from '#shared/utils/share'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) throw createError({ statusCode: 400, statusMessage: 'Ungültiger Slug' })
  const { public: pub } = useRuntimeConfig(event)
  const { qrTargetUrl } = shareLinks({ siteUrl: pub.siteUrl as string, slug, title: '', employerName: '' })
  const svg = await QRCode.toString(qrTargetUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
  setHeader(event, 'content-type', 'image/svg+xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=86400')
  return svg
})
```

```vue
<!-- app/layouts/bare.vue -->
<template>
  <div class="min-h-screen bg-background text-foreground"><main id="main-content"><slot /></main></div>
</template>
```

`app/components/jobs/ShareBox.vue` ersetzen:
```vue
<template>
  <section aria-labelledby="share-heading" class="grid gap-4 rounded-xl border border-border p-5">
    <h2 id="share-heading" class="text-xl font-bold">Kennst du jemanden, der passt?</h2>
    <p class="text-muted-foreground">Leite die Stelle weiter. Die meisten Kolleginnen kommen über Empfehlungen.</p>
    <div class="flex flex-wrap gap-3">
      <a :href="links.whatsappHref" target="_blank" rel="noopener" class="h-12 inline-flex items-center rounded-full bg-primary px-5 font-bold text-primary-foreground">Per WhatsApp teilen</a>
      <button type="button" class="h-12 inline-flex items-center rounded-full border border-border px-5 font-semibold" @click="copy">{{ copied ? 'Link kopiert' : 'Link kopieren' }}</button>
      <NuxtLink :to="`/jobs/${job.slug}/aushang`" class="h-12 inline-flex items-center rounded-full border border-border px-5 font-semibold">Aushang drucken</NuxtLink>
    </div>
    <div class="flex items-center gap-4">
      <img :src="links.qrImagePath" alt="QR-Code zu dieser Stelle" width="96" height="96" class="h-24 w-24 rounded bg-white">
      <p class="text-sm text-muted-foreground break-all">{{ links.url }}</p>
    </div>
  </section>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { shareLinks } from '#shared/utils/share'
const props = defineProps<{ job: Job; employer: Employer }>()
const { public: pub } = useRuntimeConfig()
const links = computed(() => shareLinks({ siteUrl: pub.siteUrl as string, slug: props.job.slug, title: props.job.title, employerName: props.employer.name }))
const copied = ref(false)
async function copy() {
  try { await navigator.clipboard.writeText(links.value.url); copied.value = true; setTimeout(() => (copied.value = false), 2000) } catch { window.prompt('Link kopieren:', links.value.url) }
}
</script>
```

```vue
<!-- app/pages/jobs/[slug]/aushang.vue -->
<template>
  <div v-if="job && employer" class="mx-auto max-w-[210mm] px-10 py-16 grid gap-8 text-center print:py-8">
    <p class="text-lg font-semibold">{{ employer.name }}</p>
    <h1 class="text-5xl font-extrabold tracking-tight text-balance">{{ job.title }}</h1>
    <p v-if="salary" class="text-2xl font-bold">{{ salary }}</p>
    <p class="text-xl">Kennst du jemanden? Oder willst du selbst? Handy raus, Code scannen, in einer Minute bewerben.</p>
    <img :src="links.qrImagePath" alt="QR-Code zur Stellenseite" width="320" height="320" class="mx-auto h-80 w-80">
    <p class="text-lg break-all">{{ links.url }}</p>
    <p class="text-muted-foreground">{{ employer.service_area }}</p>
    <button type="button" class="print:hidden h-12 rounded-full bg-primary px-6 font-bold text-primary-foreground" @click="print()">Drucken</button>
  </div>
</template>
<script setup lang="ts">
import { salaryText } from '#shared/utils/jobs'
import { shareLinks } from '#shared/utils/share'
definePageMeta({ layout: 'bare' })
const route = useRoute()
const { public: pub } = useRuntimeConfig()
const { employer } = await useEmployer()
const { data: job } = await useJob(route.params.slug as string)
if (!employer.value || !job.value) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar', fatal: true })
const salary = computed(() => salaryText(job.value!))
const links = computed(() => shareLinks({ siteUrl: pub.siteUrl as string, slug: job.value!.slug, title: job.value!.title, employerName: employer.value!.name }))
const print = () => window.print()
useSeoMeta({ title: () => `Aushang: ${job.value?.title}`, robots: 'noindex, nofollow' })
</script>
```

- [ ] **Step 6: Prüfen**

```bash
curl -s -o /dev/null -w "%{content_type}\n" http://localhost:3000/api/qr/pflegefachkraft
```
Erwartet: `image/svg+xml; charset=utf-8`. Im Browser: QR auf der Stellenseite sichtbar, mit dem Handy scannen führt auf `…/jobs/pflegefachkraft?src=qr` (im LAN die Dev-URL in `SITE_URL` eintragen, sonst zeigt der Code auf localhost). `/jobs/pflegefachkraft/aushang`: Druckansicht ohne Header, Quelltext enthält `noindex`.

- [ ] **Step 7: Commit**

```bash
git add shared/utils/share.ts tests/unit/share.test.ts server/api/qr app/layouts/bare.vue app/components/jobs/ShareBox.vue "app/pages/jobs/[slug]/aushang.vue"
git commit -m "Teilen-Bereich mit WhatsApp, Link kopieren, QR-Code und Aushang

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Google-Vorschau (Demo-Modus)

**Files:**
- Create: `app/pages/jobs/[slug]/google-vorschau.vue`, `app/components/jobs/JobboxCard.vue`

**Interfaces:**
- Consumes: `buildJobPosting`, `useEmployer`, `useJob`, `salaryText`, `EMPLOYMENT_TYPE_LABELS`.
- Produces: Seite mit Demo-Banner, Jobbox-Nachbildung aus dem JobPosting-Objekt, zwei fiktiven Vergleichseinträgen und dem Hinweistext aus der Spec.

- [ ] **Step 1: Karte**

```vue
<!-- app/components/jobs/JobboxCard.vue -->
<template>
  <component :is="to ? NuxtLink : 'div'" :to="to" class="grid gap-1 rounded-lg border border-border bg-white p-4 text-left text-foreground" :class="to ? 'hover:bg-secondary/40' : 'opacity-80'">
    <p class="text-base font-semibold">{{ title }}</p>
    <p class="text-sm">{{ org }}<span v-if="logoSrc"><img :src="logoSrc" alt="" width="20" height="20" class="ml-2 inline h-5 w-5 object-contain"></span></p>
    <p class="text-sm text-muted-foreground">{{ place }}<span v-if="via"> · über {{ via }}</span></p>
    <ul class="mt-1 flex flex-wrap gap-2 text-xs">
      <li v-for="c in chips" :key="c" class="rounded-md border border-border px-2 py-1">{{ c }}</li>
    </ul>
  </component>
</template>
<script setup lang="ts">
import { NuxtLink } from '#components'
defineProps<{ title: string; org: string; place: string; chips: string[]; via?: string; to?: string; logoSrc?: string }>()
</script>
```

- [ ] **Step 2: Seite**

```vue
<!-- app/pages/jobs/[slug]/google-vorschau.vue -->
<template>
  <div v-if="job && employer" class="min-h-screen bg-background">
    <p class="bg-destructive text-white text-center font-bold px-4 py-3" role="note">Demo: Dies ist eine Nachbildung, keine echte Google-Seite.</p>

    <div class="mx-auto max-w-3xl px-4 py-8 grid gap-6">
      <div class="h-12 rounded-full border border-border bg-white px-5 flex items-center text-lg">{{ query }}</div>

      <section aria-labelledby="box-heading" class="rounded-2xl border border-border bg-white p-5 grid gap-3">
        <h1 id="box-heading" class="text-xl font-bold">Stellenangebote</h1>
        <JobsJobboxCard :title="posting.title" :org="posting.hiringOrganization.name" :place="place" :chips="chips" :to="`/jobs/${job.slug}`" :logo-src="logoSrc" />
        <JobsJobboxCard title="Pflegefachkraft (m/w/d) für Zeitarbeit" org="Beispiel Personalservice" :place="employer.address_city" :chips="['Vollzeit', 'vor 5 Tagen']" via="Jobportal (fiktiv)" />
        <JobsJobboxCard title="Altenpfleger / Pflegefachkraft (m/w/d)" org="Beispiel Jobbörse" :place="`${employer.address_city} und Umgebung`" :chips="['Vollzeit', 'vor 12 Tagen']" via="Jobbörse (fiktiv)" />
        <p class="text-sm text-muted-foreground">Weitere Stellenangebote</p>
      </section>

      <section class="rounded-xl border-l-4 border-primary bg-secondary/60 p-5 grid gap-2">
        <h2 class="font-bold">Was sich nicht simulieren lässt</h2>
        <p>Ob Google die Stelle tatsächlich aufnimmt und wie schnell. Das entscheidet Google nach eigenen Regeln. Die Vorschau zeigt, wie es aussieht, wenn es klappt, und der Prüfbericht zeigt, dass die technischen Voraussetzungen erfüllt sind. Im Kundengespräch sollte das so gesagt werden, nicht als Garantie.</p>
      </section>

      <section class="grid gap-2 text-sm text-muted-foreground">
        <p>Grundlage dieser Vorschau sind dieselben Daten, die als JobPosting-Markup auf der Stellenseite liegen. Prüfbericht: Dev-Toolbar auf der Stellenseite oder <a class="underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener">Rich-Results-Test</a> mit der öffentlichen URL.</p>
        <NuxtLink :to="`/jobs/${job.slug}`" class="underline">Zur Stellenseite</NuxtLink>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import { buildJobPosting } from '#shared/utils/buildJobPosting'
import { EMPLOYMENT_TYPE_LABELS, jobLocation, salaryText } from '#shared/utils/jobs'
definePageMeta({ layout: 'bare' })
const route = useRoute()
const { public: pub } = useRuntimeConfig()
const { employer } = await useEmployer()
const { data: job } = await useJob(route.params.slug as string)
if (!employer.value || !job.value) throw createError({ statusCode: 404, statusMessage: 'Diese Stelle ist nicht mehr verfügbar', fatal: true })

const logoSrc = computed(() => {
  const logo = employer.value?.logo
  const id = typeof logo === 'string' ? logo : logo?.id
  return id ? `${pub.directusUrl}/assets/${id}?width=40&height=40&fit=contain&format=auto` : undefined
})
const posting = computed(() => buildJobPosting({ job: job.value!, employer: employer.value!, siteUrl: pub.siteUrl as string, logoUrl: logoSrc.value }))
const loc = computed(() => jobLocation(job.value!, employer.value!))
const place = computed(() => `${loc.value.city}`)
const query = computed(() => `${job.value!.title.replace(/\s*\(m\/w\/d\)/i, '')} ${loc.value.city}`)
const daysAgo = computed(() => Math.max(0, Math.round((Date.now() - new Date(job.value!.date_posted).getTime()) / 86400000)))
const chips = computed(() => [
  ...(job.value!.employment_types ?? []).map((t) => EMPLOYMENT_TYPE_LABELS[t]),
  ...(salaryText(job.value!) ? [salaryText(job.value!)!] : []),
  daysAgo.value === 0 ? 'heute' : `vor ${daysAgo.value} Tag${daysAgo.value === 1 ? '' : 'en'}`,
])
useSeoMeta({ title: 'Vorschau Jobbox', robots: 'noindex, nofollow' })
</script>
```

- [ ] **Step 3: Prüfen**

`http://localhost:3000/jobs/pflegefachkraft/google-vorschau`: rotes Demo-Banner oben, Suchfeld „Pflegefachkraft Leipzig“, eigene Stelle als erste Karte mit Gehalt und „vor 3 Tagen“, zwei fiktive Vergleichskarten, der Hinweiskasten mit dem Spec-Text wörtlich. Klick auf die erste Karte öffnet die Stellenseite. Quelltext: `noindex`, keine Google-Wortmarke.

- [ ] **Step 4: Commit**

```bash
git add "app/pages/jobs/[slug]/google-vorschau.vue" app/components/jobs/JobboxCard.vue
git commit -m "Google-Vorschau als Demo-Modus mit Hinweis und fiktiven Vergleichseinträgen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Prüfbericht in der Dev-Toolbar

**Files:**
- Modify: `app/components/DevToolbar.vue`
- Create: `app/components/jobs/JobPostingCheckPanel.vue`

**Interfaces:**
- Consumes: `useState('jobposting:current')` (Task 9), `checkJobPosting` (Task 5).

- [ ] **Step 1: Panel**

```vue
<!-- app/components/jobs/JobPostingCheckPanel.vue -->
<template>
  <div v-if="posting" class="fixed bottom-4 right-4 z-50 w-80 max-h-[70vh] overflow-auto rounded-xl border border-border bg-background p-4 text-sm shadow-lg">
    <div class="flex items-center justify-between">
      <p class="font-bold">JobPosting prüfen</p>
      <span class="rounded-full px-2 py-0.5 text-xs font-bold" :class="check.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'">{{ check.ok ? 'Pflichtfelder ok' : 'Pflichtfeld fehlt' }}</span>
    </div>
    <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pflicht</p>
    <ul class="mt-1 grid gap-1">
      <li v-for="i in check.required" :key="i.key" class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full" :class="i.ok ? 'bg-green-600' : 'bg-red-600'" />{{ i.label }}</li>
    </ul>
    <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Empfohlen</p>
    <ul class="mt-1 grid gap-1">
      <li v-for="i in check.recommended" :key="i.key" class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full" :class="i.ok ? 'bg-green-600' : 'bg-yellow-500'" />{{ i.label }}</li>
    </ul>
    <details class="mt-3"><summary class="cursor-pointer font-semibold">JSON-LD anzeigen</summary><pre class="mt-2 max-h-60 overflow-auto rounded bg-secondary p-2 text-xs">{{ JSON.stringify(posting, null, 2) }}</pre></details>
    <p class="mt-3 text-xs text-muted-foreground">Echter Test nur mit öffentlicher URL: <a class="underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener">Rich-Results-Test</a></p>
  </div>
</template>
<script setup lang="ts">
import { checkJobPosting } from '#shared/utils/jobPostingCheck'
const posting = useState<Record<string, any> | null>('jobposting:current', () => null)
const check = computed(() => checkJobPosting(posting.value ?? {}))
</script>
```

- [ ] **Step 2: In die Toolbar einhängen**

In `app/components/DevToolbar.vue` im `<template>` nach dem Breakpoint-Div ergänzen: `<JobsJobPostingCheckPanel />`.

- [ ] **Step 3: Prüfen**

Auf `/jobs/pflegefachkraft` erscheint rechts unten das Panel mit acht grünen Pflichtfeldern; „Logo“ gelb (Demo-Dienst hat kein Logo). In Directus `salary_min` der Stelle leeren, Seite neu laden: „Gehalt“ gelb. Wert wieder setzen. Auf `/jobs` erscheint kein Panel.

- [ ] **Step 4: Commit**

```bash
git add app/components/DevToolbar.vue app/components/jobs/JobPostingCheckPanel.vue
git commit -m "Prüfbericht für JobPosting in der Dev-Toolbar

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Sitemap mit Stellen

**Files:**
- Modify: `server/api/__sitemap__/pages.ts`

- [ ] **Step 1: Stellen ergänzen**

In `pages.ts` innerhalb des `try` einen dritten Request in das `Promise.all` aufnehmen und das Ergebnis anhängen:
```ts
const employerSlug = useRuntimeConfig(event).public.employerSlug as string
// … im Promise.all:
$fetch<{ data: Array<{ slug: string; date_updated: string | null }> }>(`${directusUrl}/items/jobs`, {
  query: { fields: 'slug,date_updated', filter: { status: { _eq: 'published' }, valid_through: { _gte: toIsoDate(new Date()) }, employer: { slug: { _eq: employerSlug } } }, limit: -1 },
  timeout: FETCH_TIMEOUT_MS,
}).catch(() => ({ data: [] })),
// … nach pages:
const jobs = (jobsRes?.data ?? []).map((j): SitemapUrlInput => ({ loc: `/jobs/${j.slug}`, ...(j.date_updated ? { lastmod: j.date_updated } : {}) }))
return [...pages, { loc: '/jobs' }, ...jobs]
```
mit `import { toIsoDate } from '#shared/utils/jobs'` am Dateianfang.

- [ ] **Step 2: Prüfen**

```bash
curl -s http://localhost:3000/sitemap.xml | grep -o "<loc>[^<]*</loc>"
```
Erwartet: `/`, `/jobs`, `/jobs/pflegefachkraft`, `/jobs/pflegehilfskraft`; kein `aushang`, keine `google-vorschau`.

- [ ] **Step 3: Commit**

```bash
git add server/api/__sitemap__/pages.ts
git commit -m "Sitemap: Stellenliste und sichtbare Stellen

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: Google-Anmeldung per Indexing-API

**Files:**
- Create: `scripts/google-index.mjs`

**Interfaces:**
- Consumes: `.env` mit `SITE_URL`, `DIRECTUS_URL`, `DIRECTUS_ADMIN_TOKEN`, `GOOGLE_SERVICE_ACCOUNT_JSON` (Pfad), `EMPLOYER_SLUG`.
- Produces: meldet sichtbare Stellen mit `URL_UPDATED`, unsichtbare mit gesetztem `google_indexed_at` mit `URL_DELETED`; setzt bzw. leert `google_indexed_at`.

- [ ] **Step 1: Skript**

```js
// scripts/google-index.mjs
// Meldet Stellenseiten bei der Google Indexing API an (URL_UPDATED) bzw. ab (URL_DELETED).
// Läuft nur mit GOOGLE_SERVICE_ACCOUNT_JSON (Pfad zur Service-Account-Datei, Konto in der Search Console als Inhaber eingetragen).
// Aufruf: yarn google:index   – ohne Konfiguration: Hinweis und Exit 0.
import { readFile } from 'node:fs/promises';
import { JWT } from 'google-auth-library';

const { SITE_URL, DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN, GOOGLE_SERVICE_ACCOUNT_JSON, EMPLOYER_SLUG } = process.env;
if (!GOOGLE_SERVICE_ACCOUNT_JSON) { console.log('GOOGLE_SERVICE_ACCOUNT_JSON nicht gesetzt – nichts zu tun.'); process.exit(0); }
for (const [k, v] of Object.entries({ SITE_URL, DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN, EMPLOYER_SLUG })) if (!v) { console.error(`${k} fehlt in .env`); process.exit(1); }

const key = JSON.parse(await readFile(GOOGLE_SERVICE_ACCOUNT_JSON, 'utf8'));
const client = new JWT({ email: key.client_email, key: key.private_key, scopes: ['https://www.googleapis.com/auth/indexing'] });
const base = SITE_URL.replace(/\/+$/, '');
const headers = { Authorization: `Bearer ${DIRECTUS_ADMIN_TOKEN}`, 'Content-Type': 'application/json' };
const today = new Date().toISOString().slice(0, 10);

const res = await fetch(`${DIRECTUS_URL}/items/jobs?limit=-1&fields=id,slug,status,valid_through,google_indexed_at&filter[employer][slug][_eq]=${encodeURIComponent(EMPLOYER_SLUG)}`, { headers });
const { data: jobs } = await res.json();

async function publish(url, type) {
  const r = await client.request({ url: 'https://indexing.googleapis.com/v3/urlNotifications:publish', method: 'POST', data: { url, type } });
  return r.status;
}

let updated = 0, deleted = 0;
for (const job of jobs) {
  const url = `${base}/jobs/${job.slug}`;
  const visible = job.status === 'published' && job.valid_through && job.valid_through.slice(0, 10) >= today;
  if (visible) {
    await publish(url, 'URL_UPDATED');
    await fetch(`${DIRECTUS_URL}/items/jobs/${job.id}`, { method: 'PATCH', headers, body: JSON.stringify({ google_indexed_at: new Date().toISOString() }) });
    console.log(`  + ${url}`); updated++;
  } else if (job.google_indexed_at) {
    await publish(url, 'URL_DELETED');
    await fetch(`${DIRECTUS_URL}/items/jobs/${job.id}`, { method: 'PATCH', headers, body: JSON.stringify({ google_indexed_at: null }) });
    console.log(`  - ${url}`); deleted++;
  }
}
console.log(`\n${updated} gemeldet, ${deleted} abgemeldet.\n`);
```

- [ ] **Step 2: Prüfen ohne Konto**

```bash
yarn google:index
```
Erwartet: „GOOGLE_SERVICE_ACCOUNT_JSON nicht gesetzt – nichts zu tun.“, Exit 0. Der Lauf mit echtem Konto ist erst mit Produktionsdomain möglich und wird im README als Schritt vor dem ersten Kunden beschrieben.

- [ ] **Step 3: README ergänzen und Commit**

Im README einen Abschnitt „Google-Anmeldung“: Service-Konto in der Google Cloud Console anlegen, Indexing API aktivieren, JSON-Datei außerhalb des Repos ablegen, Pfad in `GOOGLE_SERVICE_ACCOUNT_JSON`, Konto-Mail in der Search Console als Inhaber hinzufügen, dann `yarn google:index`.

```bash
git add scripts/google-index.mjs README.md
git commit -m "Skript für die Google Indexing API (an- und abmelden von Stellen)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 16: Abschluss: Typecheck, Tests, Demo-Durchlauf, Doku

**Files:**
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Alles grün**

```bash
yarn test
npx vue-tsc --noEmit -p .nuxt/tsconfig.json
npx vue-tsc --noEmit -p .nuxt/tsconfig.server.json
yarn build
```
Erwartet: alle Tests PASS, keine neuen Typfehler (vorbestehende aus dem Base-Repo sind in dessen CLAUDE.md genannt), Build läuft durch.

- [ ] **Step 2: Demo-Durchlauf dokumentieren**

Im README Abschnitt „Demo vorführen“ mit genau dieser Reihenfolge:
1. `/jobs/pflegefachkraft/google-vorschau` zeigen (Banner erklären).
2. Klick auf die Stelle, Stellenseite am Handy-Viewport zeigen (Gehalt, Dienstplan, Sticky-Button).
3. Bewerbung absenden, Mailvorschau öffnen.
4. Directus: Bewerbung unter „Bewerbungen“ mit Quelle „Demo“.
5. Dev-Toolbar: Prüfbericht zeigen.
6. Aushang drucken.

- [ ] **Step 3: CLAUDE.md um Dateikarte ergänzen**

Kurze Liste: `shared/utils/jobs.ts` (Domäne), `buildJobPosting.ts`, `jobPostingCheck.ts`, `applicationSchema.ts`, `share.ts`; `app/composables/useEmployer.ts`, `useJobs.ts`; `app/pages/jobs/*`; `server/api/apply.post.ts`, `server/api/qr/[slug].get.ts`, `server/utils/notify.ts`, `rateLimit.ts`; `scripts/setup-schema-jobs.mjs`, `seed-jobs.mjs`, `google-index.mjs`.

- [ ] **Step 4: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "Doku: Demo-Durchlauf, Google-Anmeldung, Dateikarte

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
