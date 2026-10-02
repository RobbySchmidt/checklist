# Stellenseite für Pflegedienste – Design

**Datum:** 2026-10-02
**Status:** Entwurf zur Abnahme
**Repo:** `checklist` (wird auf Basis von `nuxt-directus-base` neu aufgesetzt)

## Ziel

Ein Pflegedienst bekommt pro offene Stelle eine Bewerbungsseite, die in der Google-Jobbox erscheinen kann, per WhatsApp und QR-Code im Team geteilt wird und eine Kurzbewerbung vom Handy in unter einer Minute erlaubt. Bewerbungen landen in Directus und per Mail beim Dienst.

Zusätzlich ein Demo-Modus, mit dem Rhowerk den gesamten Vorgang (Google-Jobbox, Stellenseite, Bewerbung, Benachrichtigung) lokal vorführen kann, ohne dass eine Stelle bei Google gelistet ist.

Geschäftlicher Rahmen: Projektgeschäft „Arbeitgeberseite in 14 Tagen“ (2.000 € einmalig, 149 €/Monat).

## Einordnung: Teil 1 von 3

Das Gesamtprodukt wird in drei Teilen gebaut, jeder mit eigener Spec und eigenem Plan:

1. **Stellenseite und Demo-Modus** (diese Spec): Datenmodell, öffentliche Seiten, Kurzbewerbung, QR, Google-Vorschau, Prüfbericht, Seed.
2. **Kundenportal**: Magic-Link-Login für Dienste, Stellen anlegen/bearbeiten/schließen, Bewerber-Liste mit Status, Erinnerung nach 24 Stunden, Vorlagen für Einladung/Absage, Monatsreport, Arbeitgeberprofil pflegen.
3. **Arbeitgeberseite und Träger-Übersicht**: öffentliche Seite des Dienstes aus dem Page-Builder, mehrere Einrichtungen pro Träger.

Das Datenmodell in Teil 1 ist so angelegt, dass Teil 2 nichts umbaut: mehrere Dienste in einer Instanz, Status an jeder Bewerbung, Status `filled`/`expired` an Stellen. Teil 2 ergänzt lediglich ein Feld `employer` (M2O) auf `directus_users` und eine Rolle „Dienst“; beides wird in Teil 1 noch nicht angelegt.

## Nicht in Teil 1

- Kundenlogin oder Portal; in Teil 1 pflegt Rhowerk Stellen direkt in Directus
- Bewerber-Liste mit Erinnerungen, Monatsreport
- Mehrsprachigkeit
- Feed an Indeed oder Bundesagentur
- Arbeitgeberseite (Page-Builder bleibt dafür im Repo, wird aber nicht ausgebaut)

## Grundlage und Repo-Aufbau

- Das Repo `checklist` enthält bisher nur den leeren Nuxt-Starter. Es wird durch eine Kopie von `nuxt-directus-base` ersetzt (ohne dessen `.git`, `node_modules`, `design/`).
- Entfernt wird die Blumenhaus-Demo: `products`, `app/pages/sortiment/`, `ProductCard.vue`, `block_products`, Seed-Assets und Seed-Inhalte der Demo. Der Block-Katalog (Hero, Features, Cards, Text+Bild, Galerie, Stimmen, FAQ, Kontakt, Text) bleibt für die spätere Arbeitgeberseite.
- Directus läuft lokal per Docker (`yarn setup --name pflege-jobs`, `docker compose up -d`). Der Umzug auf eine echte Instanz geschieht später über `yarn directus:copy`.
- **Regel:** Jede Schema-Änderung geht ausschließlich über `scripts/setup-schema.mjs` (bzw. ein Zusatzskript `scripts/setup-schema-jobs.mjs`, das dieselben Helfer nutzt). Keine Handarbeit im Directus-UI, sonst bricht der Umzug.

## Datenmodell (Directus)

Mehrere Dienste von Anfang an in einer Instanz. Welcher Dienst gerendert wird, steuert `EMPLOYER_SLUG` in `.env`. So braucht der Umzug auf eine gemeinsame Produktionsinstanz keine Umstrukturierung.

### `employers`

| Feld | Typ | Hinweis |
|---|---|---|
| id | uuid | PK |
| status | select | published / draft |
| name | string | Pflichtfeld, z. B. „AWO Pflegedienst Leipzig-Süd“ |
| slug | string | unique, Pflichtfeld |
| legal_name | string | Rechtsträger für `hiringOrganization` |
| logo | file | optional |
| color_primary, color_secondary | string | Hex, optional; sonst Theme-Default |
| address_street, address_zip, address_city | string | Pflichtfeld, Büroadresse (Google braucht eine echte Straßenadresse) |
| phone | string | |
| website | string | |
| apply_email | string | Pflichtfeld, Empfänger für Bewerbungen |
| apply_whatsapp | string | optional, internationale Nummer ohne Plus |
| service_area | string | Einsatzgebiet als Text, z. B. „Leipzig-Süd, Markkleeberg, Zwenkau“ |
| about | text | kurzer Absatz über den Dienst, auf jeder Stellenseite |
| schedule_model | text | Dienstplan-Modell, z. B. „Wunschdienstplan, max. 7 Tage am Stück“ |
| benefits | json | Liste von `{ label, detail? }` |
| is_demo | boolean | Demo-Dienst; steuert die Demo-Kennzeichnung |

### `jobs`

| Feld | Typ | Hinweis |
|---|---|---|
| id | uuid | PK |
| status | select | published / draft / filled / expired |
| employer | M2O → employers | Pflichtfeld |
| title | string | Pflichtfeld, z. B. „Pflegefachkraft (m/w/d)“ |
| slug | string | unique pro Dienst, Pflichtfeld |
| employment_types | json | Teilmenge aus `FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `TEMPORARY`, `INTERN`, `OTHER` (Google-Werte); UI-Labels deutsch |
| hours_min, hours_max | integer | Wochenstunden, optional |
| start_note | string | „ab sofort“ oder Datum als Text |
| salary_min, salary_max | decimal | optional, aber dringend empfohlen |
| salary_unit | select | MONTH / HOUR |
| salary_note | string | z. B. „nach TVöD-P, plus Zulagen“ |
| location_override | json | optional `{ street, zip, city }`; sonst Adresse des Dienstes |
| intro | text | 2–3 Sätze |
| tasks | richtext | Aufgaben |
| requirements | richtext | Voraussetzungen |
| benefits_override | json | optional, sonst Benefits des Dienstes |
| contact_name | string | Ansprechperson |
| date_posted | date | Pflichtfeld, Default heute |
| valid_through | date | Pflichtfeld, Default +60 Tage |
| apply_email_override | string | optional |
| google_indexed_at | datetime | wird vom Indexing-Skript gesetzt |

Sichtbar ist eine Stelle nur, wenn `status = published` **und** `valid_through >= heute`. Alles andere liefert 404 und fehlt in Sitemap und Liste.

### `applications`

| Feld | Typ | Hinweis |
|---|---|---|
| id | uuid | PK |
| job | M2O → jobs | Pflichtfeld |
| employer | M2O → employers | wird serverseitig aus der Stelle gesetzt |
| name | string | Pflichtfeld |
| phone | string | Pflichtfeld |
| qualification | select | `pflegefachkraft`, `pflegehilfskraft`, `betreuungskraft_43b`, `auszubildende`, `hauswirtschaft`, `sonstiges` |
| hours_wish | select | `vollzeit`, `teilzeit_30`, `teilzeit_20`, `minijob`, `offen` |
| earliest_start | string | optional, Freitext |
| message | text | optional |
| source | select | `google`, `wa`, `qr`, `direct`, `demo` |
| status | select | `neu`, `kontaktiert`, `gespraech`, `zusage`, `absage`; Default `neu` |
| consent | boolean | Pflichtfeld true |
| user_agent, referrer | string | für Auswertung |
| date_created | datetime | Directus-System |

Rechte: Public-Policy darf `applications` **nur anlegen**, nie lesen. `employers` und `jobs` sind public lesbar (nur veröffentlichte Items, Filter in der Policy).

## Seiten (Nuxt)

Alle Seiten rendern den Dienst aus `EMPLOYER_SLUG`. Composable `useEmployer()` lädt ihn einmal und stellt Farben als CSS-Tokens bereit.

### `/jobs`
Liste der sichtbaren Stellen des Dienstes: Titel, Beschäftigungsart, Stunden, Gehaltsrahmen, Ort. Kurzer Kopf mit Name und Einsatzgebiet des Dienstes.

### `/jobs/[slug]` – die Stellenseite
Reihenfolge von oben nach unten, bewusst so, dass Gehalt und Dienstplan **vor** dem Formular stehen:
1. Kopf: Logo, Dienstname, Titel, Chips (Beschäftigungsart, Stunden, Start), Ort, Gehaltsrahmen groß
2. Sticky-Button mobil „Jetzt bewerben“ → springt zum Formular
3. Einleitung, Aufgaben, Voraussetzungen
4. „So arbeiten wir“: Dienstplan-Modell, Benefits, Einsatzgebiet, Ansprechperson
5. Kurzbewerbung (siehe unten)
6. Teilen-Bereich: Link kopieren, WhatsApp-Button mit vorformuliertem Text (`?src=wa`), QR-Code (verlinkt auf `?src=qr`), Link zum Aushang
7. JSON-LD `JobPosting` im Page-Scope der Schema-Registry

Bei 404 (unbekannt, draft, abgelaufen, besetzt): Hinweis „Diese Stelle ist nicht mehr verfügbar“ mit Link auf `/jobs`, HTTP-Status 404.

### Kurzbewerbung (Komponente `ApplyForm.vue`)
Felder: Name, Telefon, Qualifikation (Select), Wunschstunden (Select), frühester Start (optional), Nachricht (optional), Einwilligung (Checkbox, Pflicht), Honeypot. Kein Datei-Upload, kein Lebenslauf. Submit-Label „Rückruf anfordern“. Nach Erfolg: Bestätigungstext „Danke, {Dienstname} meldet sich innerhalb von 24 Stunden.“ Die Quelle kommt aus `?src=` (Fallback `direct`), bei Demo-Dienst immer `demo`.

### `/jobs/[slug]/aushang`
Druckbare A4-Seite: Dienstname, Titel, ein Satz, großer QR-Code (Ziel `/jobs/[slug]?src=qr`), Kurz-URL als Text. `noindex`.

### `/jobs/[slug]/google-vorschau` – Demo-Modus
Nachbildung einer Google-Suchergebnisseite für „{Titel} {Stadt}“ mit der Jobbox. Die Box zeigt die eigene Stelle (aus denselben Daten wie das JSON-LD: Titel, Dienst, Ort, Beschäftigungsart, Gehalt, „vor X Tagen“, Logo) an erster Stelle und darunter zwei generische, erkennbar fiktive Einträge (ein Portal, eine Zeitarbeitsfirma). Klick auf die eigene Stelle öffnet `/jobs/[slug]`.

Pflichtbestandteile der Seite:
- Ein dauerhaft sichtbares Banner oben: **„Demo: Dies ist eine Nachbildung, keine echte Google-Seite.“**
- Unter der Box ein Kasten mit genau diesem Text:
  > **Was sich nicht simulieren lässt:** ob Google die Stelle tatsächlich aufnimmt und wie schnell. Das entscheidet Google nach eigenen Regeln. Die Vorschau zeigt, wie es aussieht, wenn es klappt, und der Prüfbericht zeigt, dass die technischen Voraussetzungen erfüllt sind. Im Kundengespräch sollte das so gesagt werden, nicht als Garantie.
- Keine Google-Logos oder -Wortmarken, keine Nachahmung von Markenelementen über das Layout hinaus. Die Seite heißt im Titel „Vorschau Jobbox“.
- `noindex`, ohne Verlinkung aus der Navigation.

### Prüfbericht (Dev-Toolbar-Panel)
Die bestehende `DevToolbar.vue` bekommt ein Panel „JobPosting prüfen“, nur auf Stellenseiten. Es zeigt das erzeugte JSON-LD und eine Checkliste:
- **Pflicht** (rot, wenn leer): `title`, `description`, `datePosted`, `validThrough`, `hiringOrganization.name`, `jobLocation` mit `streetAddress`, `postalCode`, `addressLocality`, `addressCountry`
- **Empfohlen** (gelb, wenn leer): `baseSalary`, `employmentType`, `identifier`, `hiringOrganization.logo`, `directApply`
- Grün: gesetzt
Dazu ein Link zum echten Rich-Results-Test mit der aktuellen URL (nur sinnvoll, wenn öffentlich erreichbar; Hinweis dazu im Panel). Die Prüf-Logik lebt in `shared/utils/jobPostingCheck.ts` und ist unit-getestet.

## Server

### `POST /api/apply`
Nach Vorbild `inquiry.post.ts`: Honeypot, Zod-Schema in `shared/utils/applicationSchema.ts`, Stelle laden (muss sichtbar sein, sonst 404), `employer` aus der Stelle setzen, Item per Public-Create anlegen, danach Benachrichtigung. Antwort `{ ok: true }`. Rate-Limit: einfache In-Memory-Sperre, max. 5 Bewerbungen pro IP und Stunde.

### Benachrichtigung (`server/utils/notify.ts`)
Mail an `apply_email_override` oder `apply_email` des Dienstes, Kopie an `NOTIFY_BCC` (Rhowerk). Inhalt: die vier Angaben, Quelle, Zeit, Link zur Stelle, Rückruf-Nummer als `tel:`-Link. Transport via Nodemailer aus `NUXT_MAIL_*`. Ohne Konfiguration: Mail wird im Dev-Log ausgegeben **und** als HTML unter `.data/mail-preview/<id>.html` abgelegt, damit die Demo eine Mailvorschau zeigen kann (`/__mail/<id>` nur im Dev-Modus).

### `GET /api/qr/[slug].svg`
QR-Code als SVG (Paket `qrcode`), Ziel `/jobs/[slug]?src=qr`, absolute URL aus `SITE_URL`. Cache-Header 1 Tag.

### JSON-LD
`shared/utils/buildJobPosting.ts` baut aus Dienst und Stelle das `JobPosting`-Objekt (Felder siehe Prüfbericht; `directApply: true`; `identifier` = Stellen-ID; `baseSalary` nur, wenn `salary_min` gesetzt; `employmentType` als Array). Registrierung im Page-Scope über die bestehende Registry. Dieselbe Funktion speist die Google-Vorschau und den Prüfbericht, damit alle drei nie auseinanderlaufen.

### Sitemap
`/jobs` und alle sichtbaren Stellen; Aushang und Vorschau nicht.

### Google-Anmeldung (`scripts/google-index.mjs`)
Meldet alle sichtbaren Stellen über die Indexing-API (`URL_UPDATED`) und besetzte/abgelaufene mit `google_indexed_at` über `URL_DELETED`. Läuft nur, wenn `GOOGLE_SERVICE_ACCOUNT_JSON` gesetzt ist, sonst Hinweis und Exit 0. Setzt `google_indexed_at` per Admin-Token. Wird erst mit der Produktionsdomain relevant, ist aber Teil von v1, damit der Ablauf komplett ist.

## Demo-Daten (Seed)

`scripts/seed-content.mjs` legt an:
- Dienst „Pflegedienst Sonnenhof Leipzig“ (fiktiv, `is_demo: true`, Adresse plausibel, aber erfunden, Mail `demo@example.com`)
- Zwei Stellen: „Pflegefachkraft (m/w/d)“ Voll-/Teilzeit mit Gehaltsrahmen; „Pflegehilfskraft (m/w/d)“ Teilzeit
- `general`, Impressum, Datenschutz als Platzhalter-Seiten aus dem Base-Repo

Jede Seite eines Demo-Dienstes zeigt in der Fußzeile den Hinweis „Demo-Daten, fiktiver Pflegedienst“. Die Google-Vorschau zeigt zusätzlich das Banner oben.

## Design

Eigenes Designkonzept nach `docs/design-research.md` des Base-Repos, vor dem Styling. Rahmen: mobile-first, Formular mit großen Tippflächen, Gehalt und Dienstplan typografisch hervorgehoben. Farben kommen pro Dienst aus `employers`, Fallback ein ruhiges Grün. Keine Stockfotos in v1.

## Fehlerbehandlung

- Directus nicht erreichbar: Stellenseite liefert 503 mit kurzem Hinweis; Formular zeigt „Gerade nicht möglich, bitte rufen Sie an: {Telefon}“.
- Bewerbung gespeichert, Mail fehlgeschlagen: Antwort trotzdem `ok`, Fehler ins Log; die Bewerbung ist in Directus und geht nicht verloren.
- Ungültige Eingaben: 422 mit Feldfehlern, im Formular inline angezeigt.

## Tests

- Unit (Node-Test-Runner wie im Base-Repo): `buildJobPosting`, `jobPostingCheck`, `applicationSchema`, Sichtbarkeitsregel für Stellen.
- Manuell vor Livegang: Rich-Results-Test mit der echten URL, Bewerbung einmal vom Handy, Aushang drucken.

## Umgebungsvariablen (zusätzlich zum Base-Repo)

```
EMPLOYER_SLUG=sonnenhof-leipzig
NOTIFY_BCC=
NUXT_MAIL_HOST= NUXT_MAIL_PORT= NUXT_MAIL_USER= NUXT_MAIL_PASS= NUXT_MAIL_FROM=
GOOGLE_SERVICE_ACCOUNT_JSON=   # Pfad, nur für scripts/google-index.mjs
```

## Offene Entscheidungen (nicht blockierend)

- Produktionsdomain und Hosting (Netlify oder Mittwald). Beeinflusst nur `SITE_URL` und den Zeitpunkt der Google-Anmeldung.
- Ob WhatsApp-Benachrichtigung an den Dienst (statt nur Mail) in v1 kommt. Vorschlag: nein, Mail reicht für den ersten Kunden.
