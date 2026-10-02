# Kundenportal für Pflegedienste – Design (Teil 2)

**Datum:** 2026-10-02
**Status:** Abgenommen im Gespräch, Spec zur Prüfung
**Baut auf:** `docs/superpowers/specs/2026-10-02-pflege-stellenseite-design.md` (Teil 1, auf `main`)

## Ziel

Ein Pflegedienst pflegt seine Stellen, bearbeitet Bewerbungen und sein Arbeitgeberprofil selbst, ohne Directus. Erinnerungen und Monatsreport laufen automatisch. Rhowerk sieht alle Dienste. Betrieb als **eine Instanz für alle Kunden**, Dienst wird am Hostnamen erkannt.

## Nicht in Teil 2

Mehrere Einrichtungen pro Träger, Nutzer einladen/verwalten im Portal, Mehrsprachigkeit, Zahlungen, Arbeitgeberseite (Teil 3).

## Änderungen an Teil 1

1. **Dienst per Domain.** `employers.domains` (JSON-Liste von Hostnamen) ersetzt `EMPLOYER_SLUG`. Server-Middleware `server/middleware/employer.ts` löst `Host` → Dienst auf (Cache 5 Minuten, In-Memory), legt `event.context.employer` ab. `useEmployer()` holt den Dienst über `GET /api/employer` (liest `event.context.employer`). `EMPLOYER_SLUG` bleibt Fallback, wenn der Host `localhost` oder `127.0.0.1` ist oder kein Dienst zur Domain passt **und** die Variable gesetzt ist. Sonst: Seite „Kein Dienst für diese Adresse“ (HTTP 404, neutrales Layout). Betroffen: `useEmployer`, `useJobs` (Filter nach `employer.id` statt Slug), Sitemap, `/api/apply` (prüft, dass die Stelle zum Host-Dienst gehört), `/api/qr`.
2. **Public-Create entfällt.** `applications` ist für Public weder lesbar noch anlegbar. Der Server schreibt mit einem Directus-Token einer eigenen Rolle **„App“** (siehe Rechte). `ensurePublicCreate('applications', …)` wird aus dem Schema-Skript entfernt und die bestehende Permission gelöscht.
3. **Seitenaufrufe zählen.** Die Stellenseite ruft `POST /api/track` mit `{ job, source }` auf (clientseitig, nach dem Laden, ohne Cookie). Der Server schreibt `job_views` (Stelle, Dienst, Quelle, Datum `YYYY-MM-DD`, Zähler): ein Datensatz pro Stelle, Quelle und Tag, Zähler wird erhöht. Bots mit `User-Agent` aus einer kurzen Liste (`bot`, `crawl`, `spider`, `Googlebot`) werden nicht gezählt.

## Datenmodell (neu, CMS-Directus, per `scripts/setup-schema-portal.mjs`)

### `employers` (ergänzt)

| Feld | Typ | Hinweis |
|---|---|---|
| domains | json | Liste von Hostnamen, z. B. `["sonnenhof.pflege-jobs.de", "jobs.sonnenhof.de"]`, kleingeschrieben, ohne Port |
| notify_reminders | boolean | Erinnerungsmails an, Default true |
| report_email | string | Empfänger Monatsreport, Fallback `apply_email` |
| template_invite | text | Vorlage Einladung, Platzhalter `{name}`, `{stelle}`, `{dienst}`, `{ansprechperson}`, `{telefon}` |
| template_reject | text | Vorlage Absage, gleiche Platzhalter |

### `portal_users` (neu)

| Feld | Typ | Hinweis |
|---|---|---|
| id | uuid | |
| status | select | active / disabled |
| email | string | unique, kleingeschrieben |
| name | string | |
| role | select | `dienst` / `rhowerk` |
| employer | M2O → employers, nullable | Pflicht bei `dienst`, leer bei `rhowerk` |
| last_login | timestamp | |

### `login_tokens` (neu)

| Feld | Typ | Hinweis |
|---|---|---|
| id | uuid | |
| user | M2O → portal_users | |
| token_hash | string | SHA-256 des Tokens; der Klartext steht nur im Link |
| expires_at | timestamp | jetzt + 15 Minuten |
| used_at | timestamp, nullable | einmalige Nutzung |

### `job_views` (neu)

| Feld | Typ | Hinweis |
|---|---|---|
| id | uuid | |
| job | M2O → jobs | |
| employer | M2O → employers | |
| source | select | `google`, `wa`, `qr`, `direct` |
| day | date | |
| count | integer | |

Eindeutig je (job, source, day); der Server liest-oder-legt-an und erhöht `count`.

### `applications` (ergänzt)

| Feld | Typ | Hinweis |
|---|---|---|
| first_contact_at | timestamp, nullable | gesetzt beim ersten Wechsel weg von `neu` |
| reminder_sent_at | timestamp, nullable | Erinnerung genau einmal |
| note | text | interne Notiz des Dienstes |

## Rechte

- **Public-Policy:** Read auf `employers` (published) und `jobs` (published, gültig). Nichts auf `applications`, `portal_users`, `login_tokens`, `job_views`.
- **Rolle „App“** (neu, Static Token in `.env` als `DIRECTUS_APP_TOKEN`): Read/Create/Update auf `applications`, `job_views`, `jobs`, `employers` (nur Felder, die das Portal bearbeitet), Read/Update auf `portal_users`, Read/Create/Update auf `login_tokens`. Kein Delete außer `login_tokens`. Keine Schema-Rechte. Angelegt per Skript (`ensureRole`, `ensurePolicy`, `ensurePermissions`), Token wird einmalig manuell erzeugt und in `.env` eingetragen (README beschreibt den Schritt). `DIRECTUS_ADMIN_TOKEN` bleibt nur für `scripts/`.
- Server-Routen nutzen ausschließlich `DIRECTUS_APP_TOKEN` (Helfer `server/utils/directus.ts`: `appFetch(path, opts)`).

## Authentifizierung

- `POST /api/auth/request-link` `{ email }`: Nutzer suchen (`status = active`). Immer `{ ok: true }`, auch bei unbekannter Adresse (keine Enumeration). Bei Treffer: Token (32 Bytes, base64url) erzeugen, Hash speichern, Mail mit Link `https://<host>/portal/login?token=…` senden. Rate-Limit 5 pro E-Mail und Stunde.
- `GET /portal/login?token=…` → `POST /api/auth/consume` `{ token }`: Hash suchen, `expires_at` und `used_at` prüfen, `used_at` setzen, Session setzen (`nuxt-auth-utils`, `setUserSession`, Cookie versiegelt mit `NUXT_SESSION_PASSWORD`, 30 Tage). Session enthält `{ userId, role, employerId, name }`. `last_login` aktualisieren.
- `POST /api/auth/logout`.
- Middleware `app/middleware/portal.ts` (Route-Middleware, auf allen `/portal/*` außer `/portal/login`): ohne Session → `/portal/login`.
- Server-Helfer `requirePortalUser(event)` liest die Session, lädt bei Rolle `dienst` den Dienst der Session, bei Rolle `rhowerk` den Dienst aus dem Query-Parameter `employer` (Fallback: Host-Dienst). Liefert `{ user, employer }` oder 401/403.
- **Host-Bindung:** Ein `dienst`-Nutzer darf das Portal nur auf einem Host seines Dienstes nutzen; sonst 403 mit Hinweis auf die richtige Adresse. `rhowerk` darf überall.

## Portal-Seiten (`app/pages/portal/…`, Layout `portal`)

Layout `portal`: schmale Seitenleiste (Übersicht, Stellen, Bewerbungen, Profil, Abmelden), Name des Dienstes oben, bei Rolle `rhowerk` ein Dienst-Umschalter (Select aller Dienste).

### `/portal/login`
E-Mail-Feld, „Link senden“. Nach Absenden: „Wenn die Adresse bekannt ist, haben wir einen Link geschickt. Er gilt 15 Minuten.“ Mit `?token=` in der URL: Token einlösen, bei Erfolg zu `/portal`, bei Fehler Hinweis „Link ungültig oder abgelaufen“ mit neuem Formular.

### `/portal` Übersicht
Vier Kacheln für den laufenden Monat: Aufrufe, Bewerbungen, davon noch ohne Rückruf, offene Stellen. Darunter „Wartet auf Rückruf“: alle Bewerbungen mit `status = neu`, älteste zuerst, mit Telefonnummer als `tel:`-Link und Knopf „Kontaktiert“.

### `/portal/stellen`
Tabelle: Titel, Stand (Veröffentlicht / Entwurf / Besetzt / Abgelaufen), gültig bis, Bewerbungen (Anzahl), Aufrufe (30 Tage). Aktionen: Bearbeiten, Vorschau (neuer Tab), Teilen (öffnet Dialog mit Link kopieren, WhatsApp, QR, Aushang), Schließen/Öffnen. Knopf „Neue Stelle“.

### `/portal/stellen/neu` und `/portal/stellen/[id]`
Formular mit allen `jobs`-Feldern aus Teil 1, gruppiert: Grunddaten (Titel, Beschäftigungsart als Checkboxen, Stunden, Start), Gehalt (von, bis, Einheit, Hinweis), Inhalt (Einleitung, Aufgaben, Voraussetzungen als einfacher Rich-Text mit Listen), Einsatzort (Standard „Adresse des Dienstes“ oder abweichend), Laufzeit (veröffentlicht am, gültig bis, Default +60 Tage), Ansprechperson, Status. Slug wird aus dem Titel erzeugt und ist änderbar. Speichern → `PATCH /api/portal/jobs/:id` bzw. `POST /api/portal/jobs`. Validierung mit zod in `shared/utils/jobSchema.ts` (Browser und Server). Rechts eine Live-Prüfung „Google-Markup“ (dieselbe `checkJobPosting`-Logik wie im Dev-Panel, hier für den Kunden sichtbar, mit Klartext: „Gehalt fehlt – Stellen mit Gehalt werden häufiger angezeigt“).

### `/portal/bewerbungen`
Liste, Filter nach Stand und Stelle, Default „Neu“ zuerst. Je Zeile: Name, Telefon (`tel:`-Link), Qualifikation, Wunschstunden, Stelle, Quelle, eingegangen vor X Stunden, Stand als Select. Aufklappen zeigt Nachricht, frühester Start, Notiz (editierbar), zwei Knöpfe „Einladung“ und „Absage“: öffnen die ausgefüllte Vorlage in einem Dialog mit „Als E-Mail öffnen“ (`mailto:` – nur wenn eine E-Mail-Adresse bekannt ist; in Teil 1 gibt es keine, also zunächst nur WhatsApp) und „Per WhatsApp“ (`https://wa.me/<telefon>?text=…`), plus „Text kopieren“. Der Dienst versendet selbst; das Portal versendet keine Nachrichten an Bewerber. Statuswechsel → `PATCH /api/portal/applications/:id` `{ status, note }`; beim ersten Wechsel weg von `neu` setzt der Server `first_contact_at`.

### `/portal/profil`
Formular für `employers`: Name, Rechtsträger, Logo (Upload über Server, `POST /api/portal/upload` → Directus Files), Farben, Adresse, Telefon, Website, Bewerbungs-E-Mail, WhatsApp-Nummer, Einsatzgebiet, Über uns, Dienstplan-Modell, Benefits (Liste, hinzufügen/entfernen), Erinnerungen an/aus, Report-E-Mail, Vorlagen Einladung und Absage. Validierung `shared/utils/employerSchema.ts`.

## Server-Routen (`server/api/portal/…`, alle mit `requirePortalUser`)

| Route | Zweck |
|---|---|
| `GET /api/employer` | Host-Dienst (öffentlich, nur veröffentlichte Felder) |
| `GET /api/portal/me` | Session + Dienst (+ Liste aller Dienste bei `rhowerk`) |
| `GET /api/portal/overview` | Zahlen des Monats + wartende Bewerbungen |
| `GET /api/portal/jobs`, `POST`, `GET /:id`, `PATCH /:id` | Stellen des Dienstes; `PATCH` mit `{ status: 'filled' }` zum Schließen |
| `GET /api/portal/applications?status=&job=`, `PATCH /:id` | Bewerbungen des Dienstes |
| `GET /api/portal/employer`, `PATCH /api/portal/employer` | Profil |
| `POST /api/portal/upload` | Logo (max. 2 MB, png/jpg/svg/webp) |
| `POST /api/track` | Seitenaufruf (öffentlich, ohne Session) |
| `POST /api/auth/request-link`, `POST /api/auth/consume`, `POST /api/auth/logout` | Login |

Jede Portal-Route filtert serverseitig nach `employer.id` aus `requirePortalUser`; IDs aus dem Request werden nie ohne diesen Filter benutzt.

## Hintergrund-Jobs (Nitro `scheduledTasks`)

- **Stündlich `reminders`**: Bewerbungen mit `status = neu`, `date_created < jetzt − 24 h`, `reminder_sent_at = null`, Dienst mit `notify_reminders = true` → eine Mail pro Dienst mit allen offenen Bewerbungen, `reminder_sent_at` setzen. Betreff „Erinnerung: {n} Bewerbungen warten auf Rückruf“.
- **Täglich 06:00 `report`**: nur am 1. des Monats aktiv. Pro Dienst mit mindestens einer Stelle im Vormonat: Aufrufe pro Quelle, Bewerbungen pro Stelle, Median der Zeit bis `first_contact_at`, Stellen gültig/abgelaufen. Mail an `report_email` oder `apply_email`, BCC `NOTIFY_BCC`. Betreff „Ihr Bewerbungsreport {Monat Jahr}“.
- Beide Tasks sind auch per `POST /api/tasks/:name` mit Header `x-task-secret: $TASK_SECRET` auslösbar (für externen Cron, falls das Hosting keine Nitro-Tasks ausführt) und für manuelle Tests.
- Mails über die bestehende `notify.ts`-Infrastruktur; ohne SMTP weiterhin Vorschau-Dateien.

## Design

Portal im gleichen Token-System wie die Stellenseiten, aber neutral (Rhowerk-Grün, nicht Dienstfarbe), damit das Portal für alle Kunden gleich aussieht. Tabellen mit shadcn-Komponenten, Formulare einspaltig, große Tippflächen, da Pflegedienstleitungen oft am Tablet arbeiten. Keine Diagramme in Teil 2; Zahlen als Kacheln.

## Fehlerbehandlung

- Directus nicht erreichbar: Portal-Seiten zeigen eine Hinweiskarte „Gerade nicht erreichbar“, keine leeren Tabellen.
- Session abgelaufen: Redirect auf Login mit Hinweis.
- Mailversand fehlgeschlagen beim Magic-Link: 503 „Mail konnte nicht gesendet werden, bitte später erneut versuchen“ (hier darf der Fehler sichtbar sein, sonst wartet der Nutzer vergeblich).
- Task-Fehler bei einem Dienst brechen den Lauf für die anderen nicht ab; Fehler ins Log.

## Tests

Unit (Node-Test-Runner): `jobSchema`, `employerSchema`, Host-Auflösung (`resolveEmployerByHost` rein), Token-Erzeugung/-Hash, Platzhalter-Ersetzung der Vorlagen (`fillTemplate`), Report-Aggregation (`aggregateReport` rein über übergebene Datensätze), Erinnerungs-Auswahl (`selectReminderCandidates` rein). Manuell: Login-Rundlauf, Stelle anlegen und auf der Stellenseite sehen, Bewerbung absenden und im Portal auf „Kontaktiert“ setzen, Task per Endpoint auslösen und Mailvorschau prüfen.

## Umgebungsvariablen (neu)

```
DIRECTUS_APP_TOKEN=        # Static Token der Rolle „App“
NUXT_SESSION_PASSWORD=     # mind. 32 Zeichen, versiegelt das Session-Cookie
TASK_SECRET=               # für POST /api/tasks/:name
PORTAL_BASE_URL=           # optional; sonst wird der Host des Requests für Magic-Links genutzt
```

## Offene Entscheidungen (nicht blockierend)

- Hosting (Netlify vs. Mittwald) entscheidet, ob Nitro-Tasks nativ laufen oder der externe Cron-Endpoint genutzt wird.

## Entschieden

- Die Kurzbewerbung bekommt ein **optionales** Feld `email` (Teil-1-Formular und `applications`), damit „Einladung per E-Mail“ funktioniert. Pflicht bleiben Name und Telefon.
