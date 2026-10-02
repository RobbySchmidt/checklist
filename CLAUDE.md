# stellenpflege – Stellenseiten für Pflegedienste

Projekt aus `nuxt-directus-base`. Spec: `docs/superpowers/specs/2026-10-02-pflege-stellenseite-design.md`, Plan: `docs/superpowers/plans/2026-10-02-pflege-stellenseite.md`.

## Harte Regeln
- Schema nur über `scripts/setup-schema.mjs` + `scripts/setup-schema-jobs.mjs`. Nichts von Hand in Directus anlegen (Umzug per `yarn directus:copy -- --prefix sp_`).
- Collection-Namen des Produkts nur aus `shared/utils/collections.ts` (`C.jobs` = `sp_jobs` usw., Ordner `stellenpflege`). Präfix `sp_`, weil die Ziel-Instanz geteilt ist und dort schon eine fremde `jobs`-Collection liegt. Nie Klartext-Namen in Code oder Skripte schreiben.
- `sp_applications` ist für Public nur anlegbar, nie lesbar.
- Sichtbare Stelle: `status = published` und `valid_through >= heute` (`isJobVisible` in `shared/utils/jobs.ts`).
- Demo-Kennzeichnung nur über `sp_employers.is_demo`.
- Schema nur per Skripte: `setup-schema.mjs`, `setup-schema-jobs.mjs`, `setup-schema-portal.mjs`.
- `DIRECTUS_APP_TOKEN` nur im Server (`server/utils/directus.ts`), nie in Client-Code oder `runtimeConfig.public`.
- Portal-Routen (`server/api/portal/*`) filtern immer nach dem Dienst der Sitzung; die Rhowerk-Rolle wechselt per Dienst-Umschalter.
- Kein Versand an Bewerber: Vorlagen für Einladung/Absage werden nur angezeigt und kopiert, Mails gehen nur an Dienste.
- Keine Werte aus `.env` ausgeben. Commits auf Deutsch, letzte Zeile `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

# nuxt-directus-base – Page-Builder-Starter

Starter für Websites mit **Nuxt 4 + Directus 11 (Page Builder)**. Seiten werden im CMS aus Blöcken (M2A) zusammengesetzt, Nuxt rendert sie dynamisch. Das Repo bringt einen Grundinhalt (Startseite, Impressum, Datenschutz, Menüs) und einen **fiktiven** Demo-Pflegedienst mit Stellen mit: `yarn directus:schema` + `yarn directus:seed` bauen den Grundinhalt auf einer leeren Directus-Instanz auf, `yarn directus:schema:jobs` + `yarn directus:seed:jobs` den Demo-Dienst. Keine echten Kundendaten – alle Namen und Kontaktdaten sind erfunden und werden pro Projekt ersetzt; der Block-Katalog (Hero, Features, Cards, Text+Bild, Produkte, Galerie, Stimmen, FAQ, Kontakt, Text) ist generisch geschnitten.

Tech-Stack: Nuxt 4, Tailwind v4 (`@tailwindcss/vite`) + shadcn-nuxt (reka-ui, `app/components/ui/`), lucide-vue-next, Pinia, `nuxt-directus`, `@nuxtjs/sitemap`, isomorphic-dompurify. CMS: Directus 11 (geteilte Rhowerk-Instanz, Zugänge in `.env`).

## Dateikarte (Stellenseiten)

- `shared/utils/`: `jobs.ts` (Domäne), `buildJobPosting.ts`, `jobPostingCheck.ts`, `applicationSchema.ts`, `share.ts`
- `app/composables/`: `useEmployer.ts`, `useJobs.ts`; `app/pages/jobs/*`
- `server/`: `api/apply.post.ts`, `api/qr/[slug].get.ts`, `utils/notify.ts`, `utils/rateLimit.ts`
- Portal: `app/pages/portal/*` (login, index, bewerbungen, profil, stellen), `app/components/portal/` (Präfix `Portal`: JobForm, MessageDialog, ShareDialog), `app/middleware/portal.ts`
- Portal-Server: `server/api/auth/*` (request-link, consume, logout), `server/api/portal/*` (me, overview, employer, jobs, applications, upload), `server/utils/session.ts`, `server/utils/directus.ts` (App-Token)
- Hintergrund-Jobs: `server/tasks/reminders.ts`, `server/tasks/report.ts`, Endpoint-Fallback `server/api/tasks/[name].post.ts` (`x-task-secret`)
- Portal-Domäne in `shared/utils/`: `auth.ts`, `host.ts`, `overview.ts`, `reminders.ts`, `report.ts`, `templates.ts`, `employerSchema.ts`, `jobSchema.ts`, `inquirySchema.ts`, `track.ts`
- `scripts/`: `setup-schema-jobs.mjs`, `setup-schema-portal.mjs`, `seed-jobs.mjs`, `seed-portal.mjs`, `google-index.mjs` (noch nicht gebaut, siehe README)

## Projekt starten (Kurzfassung, Details in README.md)

Seit 2. Oktober 2026 läuft das Produkt gegen Robbys geteilte Directus-Instanz (Zugänge in `.env`: `DIRECTUS_URL`, `DIRECTUS_ADMIN_TOKEN` nur für Skripte, `DIRECTUS_APP_TOKEN` für den Betrieb). Kein Docker mehr im Repo; der alte lokale Stand liegt als `LOCAL_*`-Variablen in Robbys `.env` und als Docker-Volume `pflege-jobs_database`.

1. `yarn`
2. `.env` nach `.env.example` füllen
3. `yarn dev` (bei anderem Port: `yarn dev --port <nuxt-port>`)

Neue Instanz: `yarn directus:schema:jobs` + `yarn directus:schema:portal` (idempotent; ein gesetzter `DIRECTUS_APP_TOKEN` verhindert, dass das Portal-Skript `.env` überschreibt), Demo-Dienst per `yarn directus:seed:jobs` + `yarn directus:seed:portal`. **Nie `setup-schema.mjs`/`seed-content.mjs` gegen die geteilte Instanz laufen lassen** (Starter-Collections, dort liegen fremde `general`/`pages`).

## Page Builder – Architektur

- **Directus-Modell** (`scripts/setup-schema.mjs`, idempotent, legt fehlende Felder auch auf bestehenden Collections nach, gleicht Select-Choices und Hinweistexte (`meta.note`) ab, löscht nichts). Ordner „Website": `general` (Singleton: Homepage, Logo, Claim, Kontaktperson, Telefon, E-Mail, Adresse, Öffnungszeiten, Footer-Text, `social_profiles`), `navigation` + `navigation_items` (Menüs „Main"/„Footer"/„Legal", Typen page/url/submenu, verschachtelt über `parent`, `isLastMenuItemHighlighted` = letzter Main-Punkt als Button), `pages` (+ `seo` M2O, `blocks` M2A über `pages_blocks`), `seo`, `redirects` (from/to/code). Ordner „Blocks": nur `block_text` (heading, content als Rich-Text). Jeder Block hat über `blockCommon()` die Felder `anchor`, `background` (white/background/primary/secondary – Werte sind Tokens, Labels über `BG_CHOICES` bzw. `blockCommon(default, choices)` pro Projekt anpassbar) und `paddingBottom` (Boolean, Abstand nach unten) – Block-Komponenten reichen alle drei an `<BlockSection>` durch (`:anchor :background :padding-bottom`). Die M2A-Liste wird deklarativ gesetzt (`BLOCK_COLLECTIONS`, `ensureM2ARelation` patcht `one_allowed_collections`). Public-Leserechte setzt das Skript (Nuxt liest anonym).
- **Seed:** `scripts/seed-content.mjs` = Grundinhalt (idempotent, auf leerer Instanz getestet; Seiten, Menüs, `general`, Bilder aus `scripts/seed-assets/` mit Upsert per Dateiname, Titel = Alt-Text, Beschreibung = Bildnachweis). `scripts/seed-jobs.mjs` = Demo-Dienst (`employers.is_demo`) mit Stellen. Der Name steht als Konstante im Skript, für Header/Title zusätzlich `SITE_NAME` in `.env`. Seiten-Blöcke: gleiche Sequenz → Inhalte aktualisieren, sonst neu aufbauen (O2M/M2M-Einträge werden dabei ersetzt, nicht verdoppelt). Beide Skripte lesen `DIRECTUS_URL` + `DIRECTUS_ADMIN_TOKEN` aus `.env`; Helfer in `scripts/lib/directus-admin.mjs` (`ensureCollection`, `ensureField`, `ensureRelation`, `ensureM2ARelation` (setzt die M2A-Liste), `ensureM2AAllowed` (hängt Collections additiv an – für projektspezifische Schema-Skripte, die neben dem Basis-Skript laufen), `ensurePublicRead`, `ensurePublicCreate` (Public-Policy darf nur anlegen, z. B. Formular-Einträge – kein Admin-Token im Deployment nötig), `ensureFolder` (Media-Ordner), `ensureFile`, `upsertItem` …). Feld-Bausteine (`pkInt`, `pkUuid`, `statusField`, `input`, `select`, `richText`, `blockCommon` …) in `scripts/lib/fields.mjs` – projektspezifische Schema-Skripte importieren sie von dort.
- **Umzug/Kopie:** `yarn directus:copy` (`scripts/copy-directus.mjs`, Quelle `DIRECTUS_*` → Ziel `REAL_DIRECTUS_*` aus `.env`) kopiert Schema (nur Nicht-System-Collections), Public-Rechte, Medienordner, Dateien (Upsert nach `filename_download`) und Items (Integer-PKs werden neu vergeben → Id-Maps, zyklische M2O nachträglich gepatcht; UUID-PKs bleiben), am Ende Zähl-Vergleich. Bricht ab, wenn eine Quell-Collection im Ziel schon existiert; `--skip-schema` legt Items **doppelt** an (kein Item-Upsert), `--only-schema`. Reihenfolge über `PRIORITY`/`LAST` im Skript (M2O-Ziele nach vorn, Junctions nach hinten). Kein `/schema/apply`, damit fremde Collections im Ziel unangetastet bleiben.
- **Nuxt-Rendering:** `app/pages/index.vue` rendert `general.homepage.blocks`, `app/pages/[...slug].vue` lädt `pages` per Slug. `components/Website/ContentBlockBuilder.vue` mappt `block.collection` → `components/blocks/*.vue` (jeder Block lädt sein Item selbst via `useBlock(props, fields)` und rendert seinen eigenen `<BlockSection :anchor :background :padding-bottom>`). Header/MainMenu/MenuItem/Footer lesen `navigation` (Menü-Helfer in `app/utils/menu.ts`, Menü-State in Pinia `stores/store.ts`), Kontakt/Logo aus `general` (`useGeneral`). Bilder: `getAssetUrl()` baut Directus-Asset-URLs (mit Transformationen). Rich-Text immer über `sanitizeHtml()` ausgeben.
- **Neuen Block anlegen** (Vorbild ist `block_text`): 1) Collection `block_xyz` in `scripts/setup-schema.mjs` unter `[3/5]` ergänzen (`pkUuid`, eigene Felder, `...blockCommon()`, `group: 'Blocks'`) + in `BLOCK_COLLECTIONS` eintragen (damit hängt sie in der M2A-Liste und bekommt Public-Read), 2) `app/components/blocks/Xyz.vue` nach Vorbild `Text.vue` (`defineProps(blockProps)`, `await useBlock(props, [...felder])`, eigener `<BlockSection>`), 3) Mapping `block_xyz: resolveComponent('LazyBlocksXyz')` in `ContentBlockBuilder.vue`, 4) optional Seed in `seed-content.mjs` (`block('block_xyz', {...})`), 5) `yarn directus:schema`. Relationen (M2O/M2M/O2M) im Schritt `[4/5]` mit `ensureRelation` anlegen.
- **SEO:** `useSeoMeta` aus der `seo`-Collection; JSON-LD über `composables/schema/*`: Organization/WebSite aus `general` (`useBrandSchema`, im Layout), WebPage + Breadcrumb pro Seite (`useGenericPageSchema`). Registry `useSchemaRegistry` hat zwei Scopes – `layout` (überlebt Navigation) und `page` (wird im Router-`afterEach` in `app.vue` per `reset()` verworfen) –, merged per `@id`; genau ein `useHead` für den Graph in `app.vue`; absolute URLs über `pageUrl()` aus `useSchemaIds` (`SITE_URL`). Weitere Entities (z. B. `Store`, `JobPosting`) pro Projekt als `utils/schema/build*.ts` + Composable ergänzen und in Layout- oder Page-Scope registrieren.
- **Sitemap:** `/sitemap.xml` über `@nuxtjs/sitemap` + `server/api/__sitemap__/pages.ts` (published pages, Startseite als `/`, `seo.no_index` raus, `site.url` aus `SITE_URL`).
- **Redirects:** Collection `redirects` (from/to/code) im CMS, `server/middleware/redirects.ts` (5-min-Cache, Fail-open, case-insensitiv, generischer Trailing-Slash-Strip → 301).
- **Styling:** `app/assets/css/tailwind.css` im shadcn-Schema – Tokens (`--primary`, `--secondary`, `--accent`, `--muted`, `--border`, `--radius` … als oklch, `@theme inline` mappt sie auf Tailwind-Farben), fluid Typo (`--text-f-*`) und Abstände, Font Inter. UI-Bausteine kommen über shadcn-nuxt (`components.json`, `app/components/ui/button` → `<Button>` mit `variant`/`size`/`as-child`; weitere per `npx shadcn-vue@latest add <name>`). `cn()` in `app/lib/utils.ts`. Pro Projekt: Tokens tauschen, Rest bleibt.
- **Design-Arbeit (pro Projekt):** Vor jedem Styling `docs/design-research.md` lesen – projektneutrale Design-Regeln mit Quellen, Methode (Palette aus Assets ableiten, Kontraste per Skript nachrechnen, Fonts selbst hosten, Typo/Abstände auf `--text-f-*`/`--spacing-f-*`), Systemwissen dieses Repos (Flächen-Keys, `paddingBottom`-Geometrie, `mutedClass()`, Stolperstellen), leere Vorlage fürs Projekt-Designkonzept und Abnahme-Checkliste. Erst das Konzept schreiben (z. B. `docs/design-konzept.md`), dann Code anfassen. Der graue shadcn-Default ist nur der Auslieferungszustand, kein Designziel: jedes Projekt wird eigenständig gestaltet. shadcn-vue ist technisches Fundament – Hebel in dieser Reihenfolge: Tokens/Skalen, Komposition der Blöcke, dann die Komponenten unter `app/components/ui/` selbst anpassen (Accessibility erhalten, Änderungen im Konzept festhalten).
- **Achtung Tailwind v4:** kein `@apply` auf Component-Klassen innerhalb von `@layer components` – killt den CSS-Build ohne sichtbaren Fehler (`@utility` nutzen).
- **Flächenfarben** in `BlockSection.vue`: `white`/`background` → `text-foreground`, `primary`/`secondary` → `text-primary-foreground`/`text-secondary-foreground`; Blöcke, die auf dunklen Flächen Überschriften/Icons drehen müssen, leiten sich das aus `background` ab.
- Uploads per Skript brauchen einen MIME-Type (`ensureFile` setzt ihn) – sonst speichert Directus `application/octet-stream` und Bild-Transformationen greifen nicht.

## Arbeitsumgebung (Windows / Git Bash)

- PowerShell 5 kennt kein `&&` – Befehle einzeln. Directus-MCP für Claude Code: `.mcp.json.example` → `.mcp.json` (Token `DIRECTUS_MCP_TOKEN`, URL der Instanz aus `.env`).
- Skripte: `yarn directus:schema:jobs`, `yarn directus:schema:portal`, `yarn directus:seed:jobs`, `yarn directus:seed:portal`, `yarn portal:password`, `yarn directus:copy`; Dev-Server `yarn dev [--port N]`; Build `yarn build`.
- Blockierter Port: `netstat -ano | findstr :3000` (deutsche Locale zeigt „ABHÖREN" statt LISTENING) → `taskkill /PID … /F /T`; in Git Bash doppelte Slashes `//PID … //F //T`.
- Screenshot-Check: Chrome headless (`"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --window-size=1440,2000 --screenshot=out.png http://localhost:3000/`). **Nur den eigenen Chrome-PID beenden, nie `taskkill /IM chrome.exe`.** In Git Bash `MSYS_NO_PATHCONV=1`, sonst werden Pfade wie `/kontakt` zu Windows-Pfaden. **Mobile-Screenshots nicht über `--window-size=<500`** – Chrome hält eine Mindestbreite (Viewport bleibt ~485 px, Bild wird nur beschnitten → sieht wie horizontaler Überlauf aus). Stattdessen per CDP (`--remote-debugging-port`, Node-WebSocket) `Emulation.setDeviceMetricsOverride` + `Page.captureScreenshot`; Überlauf prüfen mit `scrollWidth == clientWidth`.
- Typecheck: `npx vue-tsc --noEmit -p .nuxt/tsconfig.json` (Client) und `-p .nuxt/tsconfig.server.json` (Server). `typeCheck` ist im Build aus.
- Vor dem Livegang: `SITE_URL` auf die Domain (sonst localhost-URLs in Schema/Sitemap), `CORS_ORIGIN` in der Directus-Instanz. **Netlify:** Env-Variablen `DIRECTUS_URL`, `SITE_URL`, `NUXT_PUBLIC_SITE_NAME` (`SITE_NAME` ist bei Netlify reserviert = Projekt-Slug, deshalb liest `nuxt.config.ts` `NUXT_PUBLIC_SITE_NAME || SITE_NAME`); kein Admin-Token ins Deployment. Werte werden beim Build gelesen → nach Änderung neu deployen. `isomorphic-dompurify` ist **exakt auf 2.22.0 gepinnt** (jsdom 26): ab 2.23 zieht jsdom 27+ ESM-only-Pakete, die die Netlify-Function ohne `require(esm)` (Node < 20.19/22.12) mit 500 „require() of ES Module …“ bei jedem SSR-Request quittiert – Client-Navigation geht trotzdem, weil der Browser Directus direkt liest. `.nvmrc` (= 24) setzt die Build-Node-Version (Netlify koppelt die Functions-Runtime daran); im Netlify-Log „Now using Node v24“ prüfen, sonst `AWS_LAMBDA_JS_RUNTIME=nodejs24.x` im Netlify-UI. `.netlify/` ist Build-Output und gitignored.

## Arbeitsweise

- Auf Deutsch, locker im Ton.
- Blöcke nach Katalog schneiden, nicht pro Seite neu erfinden; Inhalte gehören ins CMS, nicht in Vue-Templates.
- Keine echten Kundendaten in dieses Base-Repo committen – Kundenprojekte sind eigene Repos, die von hier starten.

## Bekannte offene Punkte

- Client-Navigation auf eine 404-Route (Seite nicht im CMS): `app/pages/[...slug].vue` wirft `createError` aus dem Suspense-Setup, `error.vue` erscheint nicht (SSR-404 ist korrekt) → `showError` prüfen.
- Vorbestehende Typfehler in `nuxt.config.ts`, `Footer.vue` – blockieren den Build nicht.
- `app.vue` referenziert `ogImage: '/open-graph.png'` – Datei pro Projekt unter `public/` ablegen.
