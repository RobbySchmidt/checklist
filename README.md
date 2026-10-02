# pflege-jobs

Stellenseiten für Pflegedienste: Nuxt 4 + Directus 11, Bewerbung vom Handy in einer Minute.

## Start

1. `yarn`
2. `yarn setup --name pflege-jobs --email admin@example.com`, dann `cd docker && docker compose up -d`
3. Static Token im Directus-Admin-User erzeugen und als `DIRECTUS_ADMIN_TOKEN` in `.env` eintragen
4. `yarn directus:schema && yarn directus:schema:jobs`
5. `yarn directus:seed && yarn directus:seed:jobs`
6. `yarn dev`

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

## Rich-Results-Test

JSON-LD aus dem Quelltext von `/jobs/pflegefachkraft` kopieren und unter https://search.google.com/test/rich-results als Code einfügen. Erwartet: „Stellenausschreibung: 1 gültiges Element“.

## Google-Anmeldung

`scripts/google-index.mjs` (`yarn google:index`) wird erst mit der ersten Produktionsdomain gebaut. Der Weg dann:

1. Service-Konto in der Google Cloud Console anlegen und die Indexing API aktivieren.
2. JSON-Schlüsseldatei herunterladen und außerhalb des Repos speichern.
3. Pfad in `.env` als `GOOGLE_SERVICE_ACCOUNT_JSON` eintragen.
4. Die Konto-Mail in der Search Console als Inhaber der Domain eintragen.
