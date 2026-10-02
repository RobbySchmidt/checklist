# stellenpflege

Stellenseiten für Pflegedienste: Nuxt 4 + Directus 11, Bewerbung vom Handy in einer Minute.

> Alle Produkt-Collections heißen mit Präfix `sp_` (`sp_employers`, `sp_jobs`, `sp_applications`, `sp_portal_users`, `sp_login_tokens`, `sp_job_views`) im Directus-Ordner „stellenpflege“, Namen zentral in `shared/utils/collections.ts`. Grund: Die Ziel-Instanz ist geteilt und hat schon eine eigene `jobs`-Collection. Umzug in die geteilte Instanz (so am 2. Oktober 2026 gemacht): erst Schema und Rechte gegen das Ziel anlegen mit `DIRECTUS_URL=<Ziel> DIRECTUS_ADMIN_TOKEN=<Admin> DIRECTUS_APP_TOKEN=<neuer App-Token> node scripts/setup-schema-jobs.mjs` und ebenso `setup-schema-portal.mjs` (ein gesetzter `DIRECTUS_APP_TOKEN` verhindert, dass das Skript die lokale .env überschreibt), dann die Daten mit `REAL_DIRECTUS_URL=<Ziel> REAL_DIRECTUS_ADMIN_TOKEN=<Admin> node --env-file=.env scripts/copy-directus.mjs --prefix sp_ --skip-schema`. Mit `--prefix` werden keine Medienordner und Dateien kopiert.

## Start

Das Produkt läuft gegen die geteilte Directus-Instanz von Rhowerk (kein lokales Docker mehr seit 2. Oktober 2026). Die Collections liegen dort schon.

1. `yarn`
2. `.env` aus `.env.example` anlegen: `DIRECTUS_URL`, `DIRECTUS_APP_TOKEN` (App-Rolle) und für Skripte `DIRECTUS_ADMIN_TOKEN` eintragen, dazu `SITE_URL`, `EMPLOYER_SLUG=sonnenhof-leipzig`, `DEMO_EMAIL`, `NUXT_SESSION_PASSWORD`, `TASK_SECRET` (Werte von Robby)
3. `yarn dev`

Neue Instanz aufsetzen: `yarn directus:schema:jobs && yarn directus:schema:portal` (legt Ordner, Collections, Rechte, Rolle „App“ und den App-Token an), dann `yarn directus:seed:jobs && yarn directus:seed:portal` für den Demo-Dienst.

## Portal

Unter `/portal` verwalten Dienste Stellen, Bewerbungen und ihr Profil.

- **Login:** Standard ist der Anmeldelink: E-Mail eingeben, Link per Mail (lokal über die Mailvorschau), Klick startet die Sitzung. Optional geht auch ein Passwort-Login.
- **Passwort setzen:** `yarn portal:password <email> <passwort>` (mindestens 10 Zeichen, wird als scrypt-Hash in `portal_users.password_hash` gespeichert). Ohne Passwort bleibt der Magic-Link der Weg.
- **Nutzer anlegen:** in Directus unter `portal_users` (E-Mail, Dienst, Rolle). Der Dienst bestimmt, was der Nutzer sieht.
- **Rhowerk-Rolle:** Nutzer mit der Rolle Rhowerk sehen alle Dienste und haben im Portal einen Dienst-Umschalter.
- Das Portal liest und schreibt serverseitig mit dem App-Token (`DIRECTUS_APP_TOKEN`, Benutzer `app@pflege-jobs.example.com`). Alle Portal-Routen filtern nach dem Dienst der Sitzung.

## Domains

Jeder Dienst bekommt seine Hostnamen in `employers.domains`. Der Host der Anfrage bestimmt den Dienst. Lokal funktionieren `*.localhost`-Hosts (z. B. `sonnenhof.localhost:3010`). `EMPLOYER_SLUG` ist nur der Fallback, wenn kein Host passt.

## Hintergrund-Jobs

Zwei Nitro-Tasks: `reminders` (Erinnerung an den Dienst nach 24 Stunden) und `report` (Monatsreport am 1. des Monats). Wo keine Nitro-Scheduler laufen, löst ein externer Cron sie per Endpoint aus:

```bash
curl -X POST https://<domain>/api/tasks/reminders -H "x-task-secret: $TASK_SECRET"
curl -X POST "https://<domain>/api/tasks/report?force=1" -H "x-task-secret: $TASK_SECRET"
```

`?force=1` sendet den Report auch außerhalb des 1. des Monats. Ohne gültiges `x-task-secret` antwortet der Endpoint mit 403. An Bewerber wird nichts versendet, Mails gehen nur an Dienste.

## Umgebungsvariablen

Zusätzlich zu den Basis-Variablen (`DIRECTUS_URL`, `DIRECTUS_ADMIN_TOKEN`, `SITE_URL`, `SITE_NAME`):

| Variable | Zweck |
| --- | --- |
| `EMPLOYER_SLUG` | Fallback-Dienst, wenn kein Host in `employers.domains` passt |
| `DIRECTUS_APP_TOKEN` | Token der Rolle „App“, nur serverseitig; erzeugt `yarn directus:schema:portal` |
| `NUXT_SESSION_PASSWORD` | Passwort für die Sitzungs-Cookies (mind. 32 Zeichen) |
| `TASK_SECRET` | Geheimnis für `POST /api/tasks/<name>` (Header `x-task-secret`) |
| `PORTAL_BASE_URL` | Basis-URL für Links in Mails; leer = erste Domain des Dienstes des Nutzers (Rolle `dienst`), sonst `SITE_URL`; der Host-Header der Anfrage wird nie verwendet |
| `NOTIFY_BCC` | Blindkopie aller Mails an Dienste |
| `NUXT_MAIL_HOST`, `NUXT_MAIL_PORT`, `NUXT_MAIL_SECURE`, `NUXT_MAIL_USER`, `NUXT_MAIL_PASS`, `NUXT_MAIL_FROM` | SMTP; leer = Mailvorschau. `NUXT_MAIL_FROM` mit Absendername: `stellenpflege <adresse>`. Port 587 mit `NUXT_MAIL_SECURE=false` (STARTTLS); Absender-Domain braucht SPF, DKIM und DMARC, sonst landen Mails bei Google und Microsoft im Spam oder kommen verzögert |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Pfad zum Schlüssel für die Indexing API |

## Tests

`yarn test`

## Umzug

`yarn directus:copy`

## Dokumentation

- Spec: `docs/superpowers/specs/2026-10-02-pflege-stellenseite-design.md`
- Plan: `docs/superpowers/plans/2026-10-02-pflege-stellenseite.md`

## Demo vorführen

1. `/jobs/pflegefachkraft/google-vorschau` zeigen (Banner erklären).
2. Klick auf die Stelle, Stellenseite am Handy-Viewport zeigen (Gehalt, Dienstplan, Sticky-Button).
3. Bewerbung absenden, Mailvorschau öffnen.
4. Directus: Bewerbung unter „Bewerbungen“ mit Quelle „Demo“.
5. Dev-Toolbar: Prüfbericht zeigen.
6. Aushang drucken.
7. Portal: unter `/portal/login` mit einer E-Mail aus `portal_users` anmelden, den Link aus der Mailvorschau öffnen.
8. Im Portal unter „Bewerbungen“ die Demo-Bewerbung öffnen und auf „Kontaktiert“ setzen.
9. Erinnerung auslösen: `curl -X POST http://localhost:3010/api/tasks/reminders -H "x-task-secret: $TASK_SECRET"`.
10. Monatsreport auslösen: `curl -X POST "http://localhost:3010/api/tasks/report?force=1" -H "x-task-secret: $TASK_SECRET"`, Mail in der Mailvorschau zeigen.

## Rich-Results-Test

JSON-LD aus dem Quelltext von `/jobs/pflegefachkraft` kopieren und unter https://search.google.com/test/rich-results als Code einfügen. Erwartet: „Stellenausschreibung: 1 gültiges Element“.

## Google-Anmeldung

`scripts/google-index.mjs` (`yarn google:index`) wird erst mit der ersten Produktionsdomain gebaut. Der Weg dann:

1. Service-Konto in der Google Cloud Console anlegen und die Indexing API aktivieren.
2. JSON-Schlüsseldatei herunterladen und außerhalb des Repos speichern.
3. Pfad in `.env` als `GOOGLE_SERVICE_ACCOUNT_JSON` eintragen.
4. Die Konto-Mail in der Search Console als Inhaber der Domain eintragen.

## Startseite

Die Startseite `/` leitet per 302 auf `/jobs` um; Page-Builder und CMS-Seiten bleiben im Code, werden aber nicht mehr als Startseite genutzt.

## Schnellstart für Dritte (Prototyp ansehen)

Voraussetzungen: Node 24, Yarn, eine `.env` mit den Zugängen zur Directus-Instanz (bekommt ihr von Robby). Dann im Projektordner:

1. `yarn`
2. `.env` ins Projekt legen, darin `EMPLOYER_SLUG=sonnenhof-leipzig` und `DEMO_EMAIL=<eigene Adresse>` setzen
3. `yarn portal:password <eigene Adresse> <Passwort>` für den Portal-Login (legt den Nutzer bei Bedarf nicht an; Nutzer kommen aus `yarn directus:seed:portal` oder werden im Directus angelegt)
4. `yarn dev`, dann `http://localhost:3000/jobs` (öffentliche Seite) und `http://localhost:3000/portal` (Portal)

Ohne SMTP-Zugang landen Mails als Vorschau unter `/__mail/<id>`; der Link steht nach jeder Bewerbung und jedem Anmeldelink auf der Seite. Der Ablauf für eine Vorführung steht in `docs/demo-drehbuch.md`.
