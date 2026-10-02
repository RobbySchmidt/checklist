// scripts/init-env.mjs
// Erzeugt .env und docker/.env aus den *.example-Dateien: Projektname, Ports, URLs, Zufalls-Secrets.
// Jedes Projekt bekommt einen eigenen Compose-Projektnamen (COMPOSE_PROJECT_NAME) und damit eigene
// Container + ein eigenes Datenbank-Volume – zwei Projekte aus diesem Starter kollidieren so nicht.
//
// Aufruf: yarn setup --name <slug> [--email admin@example.com] [--directus-port 8055] [--nuxt-port 3000] [--force] [--rotate-secrets]
//   --name            Projekt-Slug [a-z0-9-]; Default: Ordnername des Repos
//   --email           Admin-Login für Directus (Default admin@example.com)
//   --directus-port   Host-Port für Directus (Default 8055) – pro parallelem Projekt anders wählen
//   --nuxt-port       Port des Nuxt-Dev-Servers (Default 3000) – nur für CORS/SITE_URL, `yarn dev --port` bleibt nötig
//   --force           bestehende .env / docker/.env aktualisieren: Name, Ports, URLs, DB_DATABASE, SITE_NAME werden
//                     überschrieben; Secrets und DIRECTUS_ADMIN_TOKEN/DIRECTUS_MCP_TOKEN bleiben erhalten
//   --rotate-secrets  DIRECTUS_SECRET, DB_PASSWORD, ADMIN_PASSWORD neu würfeln (impliziert --force).
//                     Vorher `docker compose down`, dann `docker volume rm <name>_database`, sonst passt das DB-Passwort
//                     nicht mehr zum bestehenden Volume.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---- Argumente ---------------------------------------------------------------------------------
const VALUE_OPTS = ['--name', '--email', '--directus-port', '--nuxt-port'];
const BOOL_OPTS = ['--force', '--rotate-secrets'];
const EXAMPLES = { '--name': 'mein-projekt', '--email': 'admin@example.com', '--directus-port': '8056', '--nuxt-port': '3001' };
const fail = (msg) => {
  console.error(`\n  x ${msg}\n`);
  process.exit(1);
};

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (BOOL_OPTS.includes(a)) {
    opts[a] = true;
  } else if (VALUE_OPTS.includes(a)) {
    const v = args[i + 1];
    if (v === undefined || v.startsWith('--')) fail(`${a} braucht einen Wert, z. B. ${a} ${EXAMPLES[a]}`);
    opts[a] = v;
    i++;
  } else {
    fail(`Unbekanntes Argument "${a}". Erlaubt: ${[...VALUE_OPTS.map((o) => `${o} <wert>`), ...BOOL_OPTS].join(', ')}`);
  }
}

const rotateSecrets = Boolean(opts['--rotate-secrets']);
const force = Boolean(opts['--force']) || rotateSecrets;

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const rawName = opts['--name'] ?? basename(ROOT);
const name = slugify(rawName);
if (!name) fail(`Ungültiger Projektname "${rawName}" – bitte --name <slug> angeben (a-z, 0-9, Bindestrich).`);
if (opts['--name'] && name !== rawName) console.log(`  i Projektname "${rawName}" → "${name}" (slugifiziert)`);

const adminEmail = opts['--email'] ?? 'admin@example.com';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) fail(`Ungültige E-Mail-Adresse "${adminEmail}".`);

const parsePort = (flag, def) => {
  const raw = opts[flag] ?? String(def);
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || n < 1 || n > 65535) fail(`${flag} muss eine ganze Zahl zwischen 1 und 65535 sein (bekommen: "${raw}").`);
  return n;
};
const directusPort = parsePort('--directus-port', 8055);
const nuxtPort = parsePort('--nuxt-port', 3000);
if (directusPort === nuxtPort) fail(`--directus-port und --nuxt-port dürfen nicht gleich sein (${directusPort}).`);

const dbName = name.replace(/-/g, '_');
const siteName = name.split('-').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const directusUrl = `http://localhost:${directusPort}`;
const siteUrl = `http://localhost:${nuxtPort}`;

const hex = (bytes) => randomBytes(bytes).toString('hex');
const pass = (len = 20) => randomBytes(len).toString('base64url').slice(0, len);

// ---- Env-Dateien schreiben ---------------------------------------------------------------------
const readKey = (text, key) => {
  const m = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1].trim() : undefined;
};
const setKey = (text, key, val) => {
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(text) ? text.replace(re, `${key}=${val}`) : `${text.replace(/\s*$/, '')}\n${key}=${val}\n`;
};

/**
 * Schreibt targetPath. Ohne bestehende Datei: Basis ist die *.example-Datei.
 * Mit --force und bestehender Datei: Basis ist die bestehende Datei – `values` werden überschrieben,
 * `secrets` nur gesetzt, wenn leer/Platzhalter (Wert wie in der Example-Datei) oder --rotate-secrets.
 * Alle anderen Keys (Tokens …) bleiben unangetastet.
 */
function render(examplePath, targetPath, values, secrets = {}) {
  const example = resolve(ROOT, examplePath);
  const target = resolve(ROOT, targetPath);
  if (!existsSync(example)) fail(`Vorlage ${examplePath} fehlt – bitte aus dem Repo wiederherstellen (git checkout -- ${examplePath}).`);
  const exampleText = readFileSync(example, 'utf8');
  const exists = existsSync(target);
  if (exists && !force) {
    console.log(`  = ${targetPath} existiert bereits (aktualisieren mit --force)`);
    return false;
  }

  let out = exists ? readFileSync(target, 'utf8') : exampleText;
  const changed = [];
  const kept = [];

  for (const [key, val] of Object.entries(values)) {
    const old = readKey(out, key);
    if (exists && old !== undefined && old !== String(val)) changed.push(`${key}: "${old}" → "${val}"`);
    out = setKey(out, key, val);
  }
  for (const [key, make] of Object.entries(secrets)) {
    const old = readKey(out, key);
    const isPlaceholder = old === undefined || old === '' || old === readKey(exampleText, key);
    if (isPlaceholder || rotateSecrets) {
      if (exists && !isPlaceholder) changed.push(`${key}: neu gewürfelt (--rotate-secrets)`);
      out = setKey(out, key, make());
    } else {
      kept.push(key);
    }
  }

  writeFileSync(target, out, 'utf8');
  console.log(`  ${exists ? '~' : '+'} ${targetPath} ${exists ? 'aktualisiert' : 'geschrieben'}`);
  if (exists) {
    if (changed.length) {
      console.warn(`    ! Überschrieben (--force):`);
      for (const c of changed) console.warn(`      - ${c}`);
    } else {
      console.log(`    (keine Werte geändert)`);
    }
    if (kept.length) console.log(`    Beibehalten: ${kept.join(', ')} (Tokens bleiben ebenfalls stehen)`);
  }
  return true;
}

// ---- Docker-Check: läuft das Projekt schon / gibt es das Volume schon? (Docker darf fehlen) ------
const run = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).toString();
  } catch {
    return null;
  }
};
const normPath = (p) => String(p ?? '').replace(/\\/g, '/').toLowerCase();
const ownCompose = normPath(resolve(ROOT, 'docker/docker-compose.yml'));

function checkDocker() {
  // Compose-Projekte, auch gestoppte (-a)
  const lsOut = run('docker compose ls -a --format json');
  if (lsOut !== null) {
    let projects = [];
    try { projects = JSON.parse(lsOut || '[]'); } catch { projects = []; }
    const hit = Array.isArray(projects) ? projects.find((p) => p.Name === name) : null;
    if (hit) {
      const files = String(hit.ConfigFiles ?? '').split(',').map(normPath);
      if (files.includes(ownCompose)) {
        console.warn(`\n  ! Compose-Projekt "${name}" existiert bereits aus diesem Ordner (${hit.Status ?? ''}).`);
        console.warn(`    Geänderte Ports/URLs greifen erst nach \`docker compose up -d\`.`);
      } else {
        console.warn(`\n  ! Achtung: Ein Docker-Compose-Projekt "${name}" existiert bereits (${hit.Status ?? ''}).`);
        console.warn(`    Aus: ${hit.ConfigFiles ?? '?'}`);
        console.warn(`    Das ist ein ANDERES Projekt – bitte --name anders wählen, sonst teilen sich beide Container und Datenbank.`);
      }
    }
  }

  // Datenbank-Volume (bleibt auch nach `docker compose down` liegen)
  const volName = `${name}_database`;
  const volOut = run(`docker volume ls --format json --filter name=^${volName}$`);
  if (volOut !== null) {
    const found = volOut
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => { try { return JSON.parse(line); } catch { return null; } })
      .some((v) => v && v.Name === volName);
    if (found) {
      console.warn(`\n  ! Volume "${volName}" existiert – Daten werden wiederverwendet.`);
      console.warn(`    DB_PASSWORD in docker/.env muss zum Volume passen (Passwort aus dem ersten Start).`);
      if (rotateSecrets) console.warn(`    --rotate-secrets hat DB_PASSWORD geändert → \`docker volume rm ${volName}\` (löscht die Daten!) oder Passwort zurücksetzen.`);
    }
  }
}

// ---- Los -----------------------------------------------------------------------------------------
if (rotateSecrets) {
  console.warn(`\n  ! --rotate-secrets: DIRECTUS_SECRET, DB_PASSWORD und ADMIN_PASSWORD werden neu gewürfelt.`);
  console.warn(`    Volume "${name}_database" vorher entfernen (docker compose down, dann docker volume rm ${name}_database),`);
  console.warn(`    sonst passt das DB-Passwort nicht mehr. ADMIN_PASSWORD gilt nur für eine frische Datenbank.`);
}

console.log(`\nEnv-Dateien anlegen für Projekt "${name}"`);
const wroteDocker = render(
  'docker/.env.example',
  'docker/.env',
  {
    COMPOSE_PROJECT_NAME: name,
    DIRECTUS_PORT: directusPort,
    DIRECTUS_PUBLIC_URL: directusUrl,
    CORS_ORIGIN: siteUrl,
    DB_DATABASE: dbName,
    ADMIN_EMAIL: adminEmail,
  },
  {
    DIRECTUS_SECRET: () => hex(32),
    DB_PASSWORD: () => pass(24),
    ADMIN_PASSWORD: () => pass(20),
  },
);
render('.env.example', '.env', {
  DIRECTUS_URL: directusUrl,
  SITE_URL: siteUrl,
  SITE_NAME: siteName,
});
if (wroteDocker) checkDocker();

console.log(`
Projekt:        ${name}   (Compose-Projekt "${name}", Datenbank "${dbName}", Volume "${name}_database")
Directus:       ${directusUrl}   (Admin-Login: ${adminEmail}, Passwort in docker/.env)
Nuxt:           ${siteUrl}${nuxtPort !== 3000 ? `   → starten mit: yarn dev --port ${nuxtPort}` : ''}
Site-Name:      ${siteName}   (SITE_NAME in .env, gern anpassen)

Nächste Schritte:
  1. cd docker
     docker compose up -d
     cd ..
  2. In Directus (${directusUrl}) einloggen, unter User → Token einen Static Token erzeugen
     und in .env als DIRECTUS_ADMIN_TOKEN eintragen (für Claude Code zusätzlich DIRECTUS_MCP_TOKEN + .mcp.json,
     dort die URL auf Port ${directusPort} setzen)
  3. yarn directus:schema
     yarn directus:seed
  4. yarn dev${nuxtPort !== 3000 ? ` --port ${nuxtPort}` : ''}

Wichtig beim Aufräumen:
  - \`docker compose down\` OHNE -v stoppen – \`down -v\` löscht die Datenbank dieses Projekts.
  - \`docker volume prune\` trifft ALLE Projekte auf dieser Maschine. Gezielt löschen: \`docker volume rm ${name}_database\`.
  - Env-Dateien später anpassen: \`yarn setup --force …\` (Secrets bleiben), Secrets neu: \`yarn setup --rotate-secrets\`.
`);
