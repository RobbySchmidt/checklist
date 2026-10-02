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
