# Docker-Setup: Directus + Postgres

Lokales Headless-CMS für ein Projekt aus diesem Starter. Projektname, Ports und Secrets kommen aus `docker/.env` (erzeugen mit `yarn setup --name <slug>` im Projektroot, Vorlage: `docker/.env.example`).

## Starten

```sh
cd docker
docker compose up -d
```

- Directus-Admin: http://localhost:${DIRECTUS_PORT} (Standard 8055, Login siehe `.env`)
- API für Nuxt: gleiche URL; CORS ist für `CORS_ORIGIN` (Standard http://localhost:3000) freigegeben

## Mehrere Projekte parallel

Jedes Projekt braucht in seiner `docker/.env`:

- einen **eigenen `COMPOSE_PROJECT_NAME`** – er bestimmt Container- und Volume-Namen (`<name>_database`). Zwei Projekte mit demselben Namen teilen sich Container und Datenbank.
- einen **eigenen `DIRECTUS_PORT`** (+ passende `DIRECTUS_PUBLIC_URL`) und bei parallelem Nuxt-Dev-Server einen eigenen `CORS_ORIGIN`.

`docker compose ls` zeigt alle laufenden Projekte, `docker volume ls` die Datenbank-Volumes.

## Stoppen / Zurücksetzen

```sh
docker compose down                     # stoppen, Daten bleiben
docker compose down -v                  # stoppen UND Datenbank DIESES Projekts löschen (Achtung!)
docker volume rm <name>_database        # Datenbank gezielt löschen (vorher: docker volume ls)
```

**Nie `docker volume prune` ohne Kontrolle** – das löscht die Datenbanken ALLER gestoppten Projekte auf dieser Maschine.

## Struktur

- `docker-compose.yml` – Directus 11 + Postgres 16; `name:` kommt aus `COMPOSE_PROJECT_NAME` (Pflicht – ohne Wert bricht Compose mit Hinweis ab, statt still auf den Ordnernamen `docker` zurückzufallen)
- `.env` – Projektname, Ports, lokale Secrets (nicht committen), Vorlage: `docker/.env.example`
- `uploads/` – hochgeladene Dateien (Bind-Mount, gitignored)
- `extensions/` – Directus-Extensions (Bind-Mount, gitignored)
- Datenbank liegt im Named Volume `<COMPOSE_PROJECT_NAME>_database`

## Hinweise

- Der Admin-User aus `.env` wird nur beim allerersten Start angelegt; spätere Änderungen an `ADMIN_EMAIL`/`ADMIN_PASSWORD` haben keinen Effekt.
- `DIRECTUS_PUBLIC_URL` und `CORS_ORIGIN` beim Deployment auf die echten Domains setzen.
