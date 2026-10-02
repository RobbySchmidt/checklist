# pflege-jobs

Stellenseiten für Pflegedienste: Nuxt 4 + Directus 11, Bewerbung vom Handy in einer Minute.

## Start

1. `yarn`
2. `yarn setup --name pflege-jobs --email admin@example.com`, dann `cd docker && docker compose up -d`
3. Static Token im Directus-Admin-User erzeugen und als `DIRECTUS_ADMIN_TOKEN` in `.env` eintragen
4. `yarn directus:schema && yarn directus:schema:jobs && yarn directus:schema:portal` (das Portal-Skript legt Rolle „App“ an und erzeugt `DIRECTUS_APP_TOKEN` in `.env`, falls leer)
5. `yarn directus:seed && yarn directus:seed:jobs`
6. `yarn dev`

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
| `NUXT_MAIL_HOST`, `NUXT_MAIL_PORT`, `NUXT_MAIL_SECURE`, `NUXT_MAIL_USER`, `NUXT_MAIL_PASS`, `NUXT_MAIL_FROM` | SMTP; leer = Mailvorschau. `NUXT_MAIL_FROM` mit Absendername: `Pflege-Jobs Portal <adresse>`. Port 587 mit `NUXT_MAIL_SECURE=false` (STARTTLS); Absender-Domain braucht SPF, DKIM und DMARC, sonst landen Mails bei Google und Microsoft im Spam oder kommen verzögert |
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
