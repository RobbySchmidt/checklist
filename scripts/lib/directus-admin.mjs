// scripts/lib/directus-admin.mjs
// Admin-Client + idempotente Helfer für Schema-Setup und Seeding.
// Nutzung: DIRECTUS_URL + DIRECTUS_ADMIN_TOKEN aus .env (Projektroot).
import {
  createDirectus, rest, staticToken,
  readItems, readItem, createItem, updateItem, deleteItem, deleteItems, updateSingleton, readSingleton,
  createCollection, deleteCollection, createField, readField, updateField, createRelation, updateRelation, readRelation,
  readPolicies, readPermissions, createPermission,
  uploadFiles, readFiles, readFolders, createFolder,
} from '@directus/sdk';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv();

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!DIRECTUS_URL) throw new Error('DIRECTUS_URL fehlt in .env');
if (!DIRECTUS_ADMIN_TOKEN) throw new Error('DIRECTUS_ADMIN_TOKEN fehlt in .env');

export const directus = createDirectus(DIRECTUS_URL).with(rest()).with(staticToken(DIRECTUS_ADMIN_TOKEN));
export const env = { DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN };

const authHeaders = { Authorization: `Bearer ${DIRECTUS_ADMIN_TOKEN}` };

async function exists(path) {
  const res = await fetch(`${DIRECTUS_URL}${path}`, { headers: authHeaders });
  return res.ok;
}

export const collectionExists = (collection) => exists(`/collections/${collection}`);

// Collection nur anlegen, wenn nicht vorhanden. `fields` werden mit angelegt.
// Bei bestehender Collection werden fehlende Felder nachgezogen (ensureField).
export async function ensureCollection(collection, config) {
  if (await exists(`/collections/${collection}`)) {
    console.log(`  = Collection ${collection} existiert bereits`);
    for (const f of config.fields ?? []) {
      const { field, ...rest } = f;
      await ensureField(collection, field, rest, { quiet: true });
    }
    return false;
  }
  await directus.request(createCollection({ collection, ...config }));
  console.log(`  + Collection ${collection} angelegt`);
  return true;
}

// Bestehende Felder werden nicht umgebaut – nur Select-Choices (meta.options.choices) und der Hinweistext (meta.note)
// werden abgeglichen, damit neue Optionen (z. B. Flächenfarbe) und korrigierte Hinweise auch auf laufenden Instanzen ankommen.
export async function ensureField(collection, field, config, { quiet = false } = {}) {
  if (await exists(`/fields/${collection}/${field}`)) {
    const wanted = config.meta?.options?.choices;
    if (wanted) {
      const current = await directus.request(readField(collection, field));
      if (JSON.stringify(current.meta?.options?.choices ?? null) !== JSON.stringify(wanted)) {
        await directus.request(updateField(collection, field, { meta: { options: { ...current.meta?.options, choices: wanted } } }));
        console.log(`  ~ Feld ${collection}.${field}: Choices aktualisiert (${wanted.map((c) => c.value).join(", ")})`);
        return false;
      }
    }
    const wantedNote = config.meta?.note;
    if (wantedNote !== undefined) {
      const current = await directus.request(readField(collection, field));
      if ((current.meta?.note ?? null) !== (wantedNote ?? null)) {
        await directus.request(updateField(collection, field, { meta: { note: wantedNote } }));
        console.log(`  ~ Feld ${collection}.${field}: Hinweistext aktualisiert`);
        return false;
      }
    }
    if (!quiet) console.log(`  = Feld ${collection}.${field} existiert bereits`);
    return false;
  }
  await directus.request(createField(collection, { field, ...config }));
  console.log(`  + Feld ${collection}.${field} angelegt`);
  return true;
}

export async function ensureRelation(config) {
  if (await exists(`/relations/${config.collection}/${config.field}`)) {
    console.log(`  = Relation ${config.collection}.${config.field} existiert bereits`);
    return false;
  }
  await directus.request(createRelation(config));
  console.log(`  + Relation ${config.collection}.${config.field} -> ${config.related_collection ?? 'M2A'} angelegt`);
  return true;
}

// M2A-Relation: erlaubte Collections deklarativ setzen (legt Relation an oder patcht die Liste).
export async function ensureM2ARelation(config) {
  const wanted = [...config.meta.one_allowed_collections].sort();
  if (!(await exists(`/relations/${config.collection}/${config.field}`))) {
    await directus.request(createRelation(config));
    console.log(`  + M2A-Relation ${config.collection}.${config.field} angelegt (${wanted.join(', ')})`);
    return true;
  }
  const current = await directus.request(readRelation(config.collection, config.field));
  const have = [...(current.meta?.one_allowed_collections ?? [])].sort();
  if (JSON.stringify(have) === JSON.stringify(wanted)) {
    console.log(`  = M2A-Relation ${config.collection}.${config.field} ist aktuell`);
    return false;
  }
  await directus.request(updateRelation(config.collection, config.field, { meta: { one_allowed_collections: wanted } }));
  console.log(`  ~ M2A-Relation ${config.collection}.${config.field}: erlaubte Collections → ${wanted.join(', ')}`);
  return true;
}

// Eine Collection additiv in eine bestehende M2A-Relation aufnehmen (z. B. block_xyz → pages_blocks.item).
// Für projektspezifische Schemas, die die BLOCK_COLLECTIONS des Basis-Skripts nicht mitbringen. Entfernt nichts.
export async function ensureM2AAllowed(collection, field, allowed) {
  const current = await directus.request(readRelation(collection, field));
  const have = current.meta?.one_allowed_collections ?? [];
  if (have.includes(allowed)) {
    console.log(`  = M2A-Relation ${collection}.${field} erlaubt ${allowed} bereits`);
    return false;
  }
  await directus.request(updateRelation(collection, field, { meta: { one_allowed_collections: [...have, allowed] } }));
  console.log(`  ~ M2A-Relation ${collection}.${field}: ${allowed} ergänzt (${[...have, allowed].join(', ')})`);
  return true;
}

export async function removeCollection(collection) {
  if (!(await exists(`/collections/${collection}`))) return false;
  await directus.request(deleteCollection(collection));
  console.log(`  - Collection ${collection} gelöscht`);
  return true;
}

// Public-Leserecht für eine Collection (Directus 11: Policy-basiert)
let publicPolicyId = null;
export async function getPublicPolicyId() {
  if (publicPolicyId) return publicPolicyId;
  const policies = await directus.request(readPolicies({ filter: { name: { _eq: '$t:public_label' } }, fields: ['id'] }));
  if (!policies.length) throw new Error('Public-Policy nicht gefunden');
  publicPolicyId = policies[0].id;
  return publicPolicyId;
}

export async function ensurePublicRead(collection, { permissions = {}, fields = ['*'] } = {}) {
  const policy = await getPublicPolicyId();
  const existing = await directus.request(readPermissions({
    filter: { policy: { _eq: policy }, collection: { _eq: collection }, action: { _eq: 'read' } },
    fields: ['id'],
  }));
  if (existing.length) {
    console.log(`  = Public-Read auf ${collection} existiert bereits`);
    return false;
  }
  await directus.request(createPermission({ policy, collection, action: 'read', permissions, validation: {}, fields }));
  console.log(`  + Public-Read auf ${collection} angelegt`);
  return true;
}

// Datei-Ordner (Media Library) anhand des Namens finden oder anlegen – liefert die Ordner-ID für ensureFile({ folder })
// Public-Schreibrecht (z. B. Kontaktformular → inquiries): nur die genannten Felder, keine Lese-/Update-Rechte.
// Der Nuxt-Server postet ohne Token gegen /items/<collection> – so muss kein Admin-Token ins Deployment.
export async function ensurePublicCreate(collection, { fields = ['*'], validation = {}, presets = null } = {}) {
  const policy = await getPublicPolicyId();
  const existing = await directus.request(readPermissions({
    filter: { policy: { _eq: policy }, collection: { _eq: collection }, action: { _eq: 'create' } },
    fields: ['id'],
  }));
  if (existing.length) {
    console.log(`  = Public-Create auf ${collection} existiert bereits`);
    return false;
  }
  await directus.request(createPermission({ policy, collection, action: 'create', permissions: {}, validation, presets, fields }));
  console.log(`  + Public-Create auf ${collection} angelegt (Felder: ${fields.join(', ')})`);
  return true;
}

export async function ensureFolder(name, parent = null) {
  const found = await directus.request(readFolders({ filter: { name: { _eq: name }, parent: parent ? { _eq: parent } : { _null: true } }, fields: ['id'], limit: 1 }));
  if (found.length) {
    console.log(`  = Ordner ${name} existiert bereits (${found[0].id})`);
    return found[0].id;
  }
  const folder = await directus.request(createFolder({ name, parent }));
  console.log(`  + Ordner ${name} angelegt (${folder.id})`);
  return folder.id;
}

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf',
};

// Datei hochladen (idempotent über filename_download).
// Wichtig: MIME-Type mitgeben, sonst speichert Directus application/octet-stream
// und kann weder Bildmaße auslesen noch Transformationen (?width=...) anwenden.
export async function ensureFile(localPath, { title, folder, description } = {}) {
  const name = basename(localPath);
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  const type = MIME_BY_EXT[ext] ?? 'application/octet-stream';
  const found = await directus.request(readFiles({ filter: { filename_download: { _eq: name } }, fields: ['id', 'filename_download'], limit: 1 }));
  if (found.length) {
    console.log(`  = Datei ${name} existiert bereits (${found[0].id})`);
    return found[0].id;
  }
  const buffer = await readFile(localPath);
  const form = new FormData();
  if (title) form.append('title', title);
  if (folder) form.append('folder', folder);
  if (description) form.append('description', description);
  form.append('file', new Blob([buffer], { type }), name);
  const file = await directus.request(uploadFiles(form));
  console.log(`  + Datei ${name} hochgeladen (${file.id})`);
  return file.id;
}

export async function fileExists(name) {
  const found = await directus.request(readFiles({ filter: { filename_download: { _eq: name } }, fields: ['id'], limit: 1 }));
  return found.length > 0;
}

// Item anhand eines eindeutigen Feldes finden oder anlegen
export async function ensureItem(collection, uniqueFilter, data) {
  const found = await directus.request(readItems(collection, { filter: uniqueFilter, fields: ['id'], limit: 1 }));
  if (found.length) {
    console.log(`  = ${collection} ${JSON.stringify(uniqueFilter)} existiert bereits (${found[0].id})`);
    return found[0].id;
  }
  const item = await directus.request(createItem(collection, data));
  console.log(`  + ${collection} ${JSON.stringify(uniqueFilter)} angelegt (${item.id})`);
  return item.id;
}

// Item anhand eines eindeutigen Feldes anlegen ODER mit `data` aktualisieren (Seed bleibt Quelle der Wahrheit)
export async function upsertItem(collection, uniqueFilter, data, label = JSON.stringify(uniqueFilter)) {
  const found = await directus.request(readItems(collection, { filter: uniqueFilter, fields: ['id'], limit: 1 }));
  if (found.length) {
    await directus.request(updateItem(collection, found[0].id, data));
    console.log(`  ~ ${collection} ${label} aktualisiert (${found[0].id})`);
    return found[0].id;
  }
  const item = await directus.request(createItem(collection, data));
  console.log(`  + ${collection} ${label} angelegt (${item.id})`);
  return item.id;
}

export { readItems, readItem, createItem, updateItem, deleteItem, deleteItems, updateSingleton, readSingleton };
