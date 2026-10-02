#!/usr/bin/env node
// Kopiert diese Website 1:1 von einem Directus in ein anderes: Schema (nur Nicht-System-Collections der Quelle),
// Public-Leserechte, Medienordner, Dateien und alle Inhalte. Fremde Collections im Ziel bleiben unangetastet.
//
// Quelle:  DIRECTUS_URL       + DIRECTUS_ADMIN_TOKEN        (z. B. lokales Docker-Directus)
// Ziel:    REAL_DIRECTUS_URL  + REAL_DIRECTUS_ADMIN_TOKEN   (aus .env)
// Aufruf:  node --env-file=.env scripts/copy-directus.mjs [--only-schema] [--skip-schema] [--prefix sp_]
//          --prefix sp_ kopiert nur die Produkt-Collections (shared/utils/collections.ts) samt Ordner „stellenpflege“ –
//          für den Umzug in eine geteilte Directus-Instanz, in der schon fremde Collections liegen.
//
// Laufende Integer-IDs (pages, navigation_items, …) vergibt das Ziel neu – alle Verweise (M2O, M2A, Junctions, Singleton) werden umgerechnet.
// UUID-IDs (Blöcke, seo) bleiben erhalten. Dateien werden anhand von filename_download wiedererkannt (idempotent),
// Items nicht: Das Skript bricht ab, wenn eine der Quell-Collections im Ziel bereits existiert (außer mit --skip-schema).

const SRC = { url: process.env.DIRECTUS_URL, token: process.env.DIRECTUS_ADMIN_TOKEN };
const DST = { url: process.env.REAL_DIRECTUS_URL, token: process.env.REAL_DIRECTUS_ADMIN_TOKEN };
for (const [k, v] of Object.entries({ DIRECTUS_URL: SRC.url, DIRECTUS_ADMIN_TOKEN: SRC.token, REAL_DIRECTUS_URL: DST.url, REAL_DIRECTUS_ADMIN_TOKEN: DST.token })) {
  if (!v) throw new Error(`${k} fehlt in .env`);
}
if (SRC.url.replace(/\/$/, '') === DST.url.replace(/\/$/, '')) throw new Error('Quelle und Ziel sind dieselbe Instanz');
const args = new Set(process.argv.slice(2));
const ONLY_SCHEMA = args.has('--only-schema');
const SKIP_SCHEMA = args.has('--skip-schema');
const prefixArg = process.argv.indexOf('--prefix');
const PREFIX = prefixArg > -1 ? process.argv[prefixArg + 1] : null;
const FOLDER = 'stellenpflege';

const SYSTEM_FIELDS = new Set(['user_created', 'user_updated']);
const SKIP_FIELD_META = new Set(['id', 'searchable']); // Ziel-Version kennt evtl. nicht alle Meta-Keys

const call = (inst) => async (method, path, body, { raw = false } = {}) => {
  const headers = { Authorization: `Bearer ${inst.token}` };
  let payload = body;
  if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${inst.url}${path}`, { method, headers, body: payload });
  if (!res.ok) throw new Error(`${method} ${inst.url}${path} → ${res.status}: ${(await res.text()).slice(0, 400)}`);
  if (raw) return res;
  if (res.status === 204) return null;
  const json = await res.json();
  return json.data;
};
const src = call(SRC);
const dst = call(DST);

const isSystem = (c) => c.startsWith('directus_');
const log = (msg) => console.log(msg);

// ---------------------------------------------------------------- Quelle einlesen
log(`Quelle: ${SRC.url}\nZiel:   ${DST.url}\n`);
const srcInfo = await src('GET', '/server/info');
const dstInfo = await dst('GET', '/server/info');
log(`Versionen: Quelle ${srcInfo.version} → Ziel ${dstInfo.version}`);

const inScope = (name) => !isSystem(name) && (!PREFIX || name.startsWith(PREFIX) || name === FOLDER);
const srcCollections = (await src('GET', '/collections')).filter((c) => inScope(c.collection));
const srcFields = (await src('GET', '/fields')).filter((f) => inScope(f.collection));
const srcRelations = (await src('GET', '/relations')).filter((r) => inScope(r.collection));
if (PREFIX) log(`Nur Collections mit Präfix „${PREFIX}“ (+ Ordner „${FOLDER}“)`);
const collectionNames = srcCollections.map((c) => c.collection);
const tables = srcCollections.filter((c) => c.schema); // echte Tabellen (keine Ordner)
log(`Collections in der Quelle: ${collectionNames.length} (${tables.length} Tabellen, ${collectionNames.length - tables.length} Ordner)`);

const dstCollections = await dst('GET', '/collections');
const dstNames = new Set(dstCollections.map((c) => c.collection));

// ---------------------------------------------------------------- [1/6] Schema
if (!SKIP_SCHEMA) {
  log('\n[1/6] Schema (Collections, Felder, Relationen)');
  const clash = collectionNames.filter((n) => dstNames.has(n));
  if (clash.length) throw new Error(`Im Ziel existieren bereits: ${clash.join(', ')} – abgebrochen (nichts verändert). Mit --skip-schema nur Inhalte kopieren.`);

  // Ordner zuerst (Gruppen können verschachtelt sein), dann Tabellen; Reihenfolge nach group-Abhängigkeit
  const created = new Set();
  const pending = [...srcCollections];
  while (pending.length) {
    const next = pending.findIndex((c) => !c.meta?.group || created.has(c.meta.group) || !collectionNames.includes(c.meta.group));
    if (next < 0) throw new Error('Zyklische Collection-Gruppen?');
    const [c] = pending.splice(next, 1);
    const fields = srcFields
      .filter((f) => f.collection === c.collection)
      .sort((a, b) => (a.meta?.sort ?? 0) - (b.meta?.sort ?? 0))
      .map((f) => ({ field: f.field, type: f.type, schema: f.schema ?? undefined, meta: f.meta ? Object.fromEntries(Object.entries(f.meta).filter(([k]) => !SKIP_FIELD_META.has(k))) : undefined }));
    const meta = { ...c.meta };
    delete meta.collection;
    await dst('POST', '/collections', { collection: c.collection, meta, schema: c.schema ? {} : null, fields: c.schema ? fields : undefined });
    created.add(c.collection);
    log(`  + ${c.schema ? 'Collection' : 'Ordner'} ${c.collection}${c.schema ? ` (${fields.length} Felder)` : ''}`);
  }

  // Relationen (M2O, O2M-Gegenstücke, M2A) – nach beiden Seiten
  for (const r of srcRelations) {
    const meta = r.meta ? Object.fromEntries(Object.entries(r.meta).filter(([k]) => k !== 'id')) : undefined;
    await dst('POST', '/relations', { collection: r.collection, field: r.field, related_collection: r.related_collection ?? undefined, schema: r.schema ?? undefined, meta });
    log(`  + Relation ${r.collection}.${r.field} → ${r.related_collection ?? `(M2A: ${meta?.one_allowed_collections?.join(',')})`}`);
  }

  // Public-Leserechte übernehmen
  const policyOf = async (inst) => (await inst('GET', '/policies?filter[name][_eq]=$t:public_label&fields=id'))[0]?.id;
  const srcPolicy = await policyOf(src);
  const dstPolicy = await policyOf(dst);
  if (!srcPolicy || !dstPolicy) throw new Error('Public-Policy nicht gefunden');
  const srcPerms = (await src('GET', `/permissions?filter[policy][_eq]=${srcPolicy}&limit=-1`)).filter((p) => collectionNames.includes(p.collection));
  const dstPerms = await dst('GET', `/permissions?filter[policy][_eq]=${dstPolicy}&limit=-1`);
  for (const p of srcPerms) {
    if (dstPerms.some((d) => d.collection === p.collection && d.action === p.action)) { log(`  = Public ${p.action} ${p.collection} existiert`); continue; }
    await dst('POST', '/permissions', { policy: dstPolicy, collection: p.collection, action: p.action, permissions: p.permissions ?? {}, validation: p.validation ?? {}, presets: p.presets ?? null, fields: p.fields ?? ['*'] });
    log(`  + Public ${p.action} ${p.collection}`);
  }
} else {
  log('\n[1/6] Schema übersprungen (--skip-schema)');
}
if (ONLY_SCHEMA) { log('\nFertig (--only-schema).'); process.exit(0); }

// ---------------------------------------------------------------- [2/6] Medienordner
log('\n[2/6] Medienordner');
const srcFolders = await src('GET', '/folders?limit=-1&fields=id,name,parent');
const folderMap = new Map(); // src id → dst id
{
  const dstFolders = await dst('GET', '/folders?limit=-1&fields=id,name,parent');
  const pending = [...srcFolders];
  while (pending.length) {
    const i = pending.findIndex((f) => !f.parent || folderMap.has(f.parent));
    if (i < 0) throw new Error('Ordner-Eltern nicht auflösbar');
    const [f] = pending.splice(i, 1);
    const parent = f.parent ? folderMap.get(f.parent) : null;
    let found = dstFolders.find((d) => d.name === f.name && (d.parent ?? null) === parent);
    if (!found) {
      found = await dst('POST', '/folders', { name: f.name, parent });
      dstFolders.push(found);
      log(`  + Ordner ${f.name}`);
    } else log(`  = Ordner ${f.name} existiert`);
    folderMap.set(f.id, found.id);
  }
}

// ---------------------------------------------------------------- [3/6] Dateien
log('\n[3/6] Dateien');
const fileMap = new Map(); // src id → dst id
{
  const srcFiles = await src('GET', '/files?limit=-1&fields=id,filename_download,title,type,folder,description,tags,width,height,filesize');
  const dstFiles = await dst('GET', '/files?limit=-1&fields=id,filename_download');
  for (const f of srcFiles) {
    const existing = dstFiles.find((d) => d.filename_download === f.filename_download);
    if (existing) { fileMap.set(f.id, existing.id); log(`  = ${f.filename_download} existiert`); continue; }
    const res = await src('GET', `/assets/${f.id}`, undefined, { raw: true });
    const blob = new Blob([await res.arrayBuffer()], { type: f.type || 'application/octet-stream' });
    const form = new FormData();
    if (f.title) form.append('title', f.title);
    if (f.description) form.append('description', f.description);
    if (f.folder && folderMap.get(f.folder)) form.append('folder', folderMap.get(f.folder));
    form.append('file', blob, f.filename_download);
    const up = await dst('POST', '/files', form);
    fileMap.set(f.id, up.id);
    log(`  + ${f.filename_download} (${Math.round((f.filesize ?? 0) / 1024)} kB)`);
  }
}

// ---------------------------------------------------------------- [4/6] Inhalte
log('\n[4/6] Inhalte');
// M2O-Felder je Collection: field → related_collection (inkl. directus_files); Alias-Felder (O2M/M2M/M2A-Listen) werden nicht kopiert
const m2o = new Map(); // `${collection}.${field}` → related_collection
const aliasFields = new Set();
for (const f of srcFields) if (f.type === 'alias' || f.meta?.special?.some((s) => ['o2m', 'm2m', 'm2a', 'alias', 'no-data'].includes(s))) aliasFields.add(`${f.collection}.${f.field}`);
for (const r of srcRelations) if (r.related_collection) m2o.set(`${r.collection}.${r.field}`, r.related_collection);
const m2aItemFields = new Map(); // `${collection}.${field}` (item) → collection-Feld (M2A: item-Wert gehört zu einer der erlaubten Collections)
for (const r of srcRelations) if (!r.related_collection && r.meta?.one_collection_field) m2aItemFields.set(`${r.collection}.${r.field}`, r.meta.one_collection_field);

const pkOf = (collection) => srcFields.find((f) => f.collection === collection && f.schema?.is_primary_key);
const idMap = new Map(collectionNames.map((c) => [c, new Map()])); // collection → (src id → dst id)
for (const [s, d] of fileMap) idMap.set('directus_files', fileMap);

const deferred = []; // { collection, dstId, field, srcRef, target }
const mapRef = (target, value) => {
  if (value === null || value === undefined) return { ok: true, value };
  const key = typeof value === 'object' ? value.id : value;
  const map = idMap.get(target);
  if (!map) return { ok: true, value: key }; // unbekannte Ziel-Collection (System) – roh übernehmen
  const pk = target === 'directus_files' ? null : pkOf(target);
  if (pk?.type === 'uuid') return { ok: true, value: key }; // UUIDs bleiben stabil
  return map.has(key) ? { ok: true, value: map.get(key) } : { ok: false, value: key };
};

// Reihenfolge: möglichst Abhängigkeiten zuerst, Junctions und Singletons zuletzt; Rest alphabetisch
// Pro Projekt ergänzen: Collections, auf die andere per M2O zeigen, nach vorn; Junction-Tabellen (M2M) nach hinten.
const PRIORITY = ['seo', 'pages', 'navigation', 'navigation_items', 'sp_employers', 'sp_jobs', 'sp_portal_users'];
const LAST = ['pages_blocks', 'general'];
const ordered = [
  ...PRIORITY.filter((n) => tables.some((t) => t.collection === n)),
  ...tables.map((t) => t.collection).filter((n) => !PRIORITY.includes(n) && !LAST.includes(n)).sort(),
  ...LAST.filter((n) => tables.some((t) => t.collection === n)),
];

for (const collection of ordered) {
  const meta = tables.find((t) => t.collection === collection).meta;
  const pk = pkOf(collection);
  const map = idMap.get(collection);
  const items = meta?.singleton
    ? [await src('GET', `/items/${collection}`)].filter(Boolean)
    : await src('GET', `/items/${collection}?limit=-1${meta?.sort_field ? `&sort=${meta.sort_field}` : pk ? `&sort=${pk.field}` : ''}`);
  let n = 0;
  for (const item of items) {
    const body = {};
    for (const [field, value] of Object.entries(item)) {
      if (SYSTEM_FIELDS.has(field) || aliasFields.has(`${collection}.${field}`)) continue;
      if (field === pk?.field) { if (pk.type === 'uuid') body[field] = value; continue; }
      const target = m2o.get(`${collection}.${field}`);
      if (target) {
        const r = mapRef(target, value);
        body[field] = r.ok ? r.value : null;
        if (!r.ok) deferred.push({ collection, srcId: item[pk.field], field, srcRef: r.value, target });
        continue;
      }
      const m2aCollField = m2aItemFields.get(`${collection}.${field}`);
      if (m2aCollField) {
        const r = mapRef(item[m2aCollField], value);
        body[field] = r.ok ? r.value : null;
        if (!r.ok) deferred.push({ collection, srcId: item[pk.field], field, srcRef: r.value, target: item[m2aCollField] });
        continue;
      }
      body[field] = value;
    }
    if (meta?.singleton) {
      await dst('PATCH', `/items/${collection}`, body);
    } else {
      const created = await dst('POST', `/items/${collection}`, body);
      map.set(item[pk.field], created[pk.field]);
    }
    n++;
  }
  log(`  + ${collection}: ${n} Item${n === 1 ? '' : 's'}${meta?.singleton ? ' (Singleton)' : ''}`);
}

// Zurückgestellte Verweise (Zyklen, z. B. navigation_items.parent oder zwei Collections, die gegenseitig per M2O aufeinander zeigen) nachtragen
log('\n[5/6] Verweise nachtragen');
for (const d of deferred) {
  const r = mapRef(d.target, d.srcRef);
  if (!r.ok) { log(`  ! ${d.collection}.${d.field} → ${d.target}#${d.srcRef} nicht auflösbar (bleibt leer)`); continue; }
  const meta = tables.find((t) => t.collection === d.collection).meta;
  if (meta?.singleton) await dst('PATCH', `/items/${d.collection}`, { [d.field]: r.value });
  else await dst('PATCH', `/items/${d.collection}/${idMap.get(d.collection).get(d.srcId)}`, { [d.field]: r.value });
  log(`  ~ ${d.collection}.${d.field} → ${d.target}#${d.srcRef} → #${r.value}`);
}

// ---------------------------------------------------------------- [6/6] Kontrolle
log('\n[6/6] Kontrolle (Item-Zahlen Quelle → Ziel)');
let mismatch = 0;
for (const t of tables) {
  if (t.meta?.singleton) continue;
  const count = async (inst) => (await inst('GET', `/items/${t.collection}?aggregate[count]=*`))[0]?.count ?? '?';
  const [a, b] = [await count(src), await count(dst)];
  if (String(a) !== String(b)) mismatch++;
  log(`  ${String(a) === String(b) ? '✓' : '✗'} ${t.collection}: ${a} → ${b}`);
}
log(mismatch ? `\n${mismatch} Abweichung(en) – bitte prüfen.` : '\nFertig – alles übertragen.');
