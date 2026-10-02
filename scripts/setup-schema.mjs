// scripts/setup-schema.mjs
// Legt das Page-Builder-Datenmodell an:
// Ordner „Website": general (Singleton), navigation + navigation_items, pages + pages_blocks (M2A), seo, redirects.
// Ordner „Blocks": block_text + Landing-Page-Blöcke (hero, features, cards, text_media, gallery, testimonials, faq, contact).
// Dazu „inquiries" (Kontaktformular, Public-Create).
// Idempotent – kann beliebig oft laufen (legt fehlende Felder auch auf bestehenden Collections nach, löscht nichts).
// Aufruf: yarn directus:schema
import {
  ensureCollection, ensureRelation, ensureM2ARelation, ensurePublicRead, ensurePublicCreate,
} from './lib/directus-admin.mjs';

// Feld-Bausteine (pkInt, statusField, input, select, blockCommon …) liegen in scripts/lib/fields.mjs – auch für projektspezifische Schemas nutzbar.
import {
  pkInt, pkUuid, sortField, statusField, auditFields, input, textarea, richText, fileField, boolField, m2oField, o2mField, intField, slugField, archiveMeta, select, blockCommon,
} from './lib/fields.mjs';

// ---------------------------------------------------------------- 1. Ordner
console.log('\n[1/5] Ordner-Collections (nur UI-Gruppierung)');
await ensureCollection('Website', { meta: { icon: 'web', note: 'Seiten, Navigation, SEO, globale Einstellungen', sort: 1, collapse: 'open' }, schema: null });
await ensureCollection('Blocks', { meta: { icon: 'view_quilt', note: 'Inhaltsblöcke für den Page Builder', sort: 2, collapse: 'closed' }, schema: null });

// ---------------------------------------------------------------- 2. Website-Collections
console.log('\n[2/5] Website-Collections');

await ensureCollection('seo', {
  meta: { icon: 'search', group: 'Website', note: 'SEO-Metadaten, per M2O an Seiten gehängt', display_template: '{{title}}', sort: 4 },
  schema: {},
  fields: [
    pkUuid,
    { field: 'title', type: 'text', meta: { interface: 'input-multiline', width: 'full', options: { trim: true, softLength: 55 }, note: 'Meta-Title (max. ~55 Zeichen)' }, schema: {} },
    { field: 'meta_description', type: 'text', meta: { interface: 'input-multiline', width: 'full', options: { trim: true, softLength: 150 }, note: 'Meta-Description (max. ~150 Zeichen)' }, schema: {} },
    { field: 'canonical_url', type: 'text', meta: { interface: 'input-multiline', width: 'full' }, schema: {} },
    boolField('no_index', 'Seite nicht indexieren'),
    boolField('no_follow', 'Links nicht folgen'),
    fileField('og_image', 'Open-Graph-Bild (1200×630)'),
  ],
});

await ensureCollection('pages', {
  meta: {
    icon: 'article', group: 'Website', note: 'Seiten mit Page-Builder-Blöcken', display_template: '{{title}}',
    archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true, sort_field: 'sort', sort: 1,
    preview_url: `${process.env.SITE_URL ?? 'http://localhost:3000'}/{{slug}}`,
  },
  schema: {},
  fields: [
    pkInt, statusField, sortField, ...auditFields,
    { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', required: true }, schema: {} },
    { field: 'slug', type: 'string', meta: { interface: 'input', width: 'half', note: 'URL-Slug ohne Slash, z. B. "leistungen"', options: { slug: true, trim: true } }, schema: { is_unique: true } },
    { field: 'seo', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'full', options: { template: '{{title}} – {{meta_description}}' } }, schema: {} },
    { field: 'blocks', type: 'alias', meta: { interface: 'list-m2a', special: ['m2a'], width: 'full', options: { enableSelect: false } }, schema: null },
  ],
});

await ensureCollection('pages_blocks', {
  meta: { hidden: true, icon: 'import_export', group: 'Website', sort: 99 },
  schema: {},
  fields: [
    pkInt,
    { field: 'pages_id', type: 'integer', meta: { hidden: true }, schema: {} },
    { field: 'item', type: 'string', meta: { hidden: true }, schema: {} },
    { field: 'collection', type: 'string', meta: { hidden: true }, schema: {} },
    sortField,
  ],
});

await ensureCollection('navigation', {
  meta: { icon: 'menu', group: 'Website', note: 'Menüs (Main, Footer, Legal)', display_template: '{{title}}', sort: 2 },
  schema: {},
  fields: [
    pkInt,
    { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', required: true, note: '"Main", "Footer" oder "Legal" – wird im Frontend so abgefragt' }, schema: {} },
    boolField('isLastMenuItemHighlighted', 'Letzten Menüpunkt als Button (Primärfarbe) hervorheben (Main)'),
    { field: 'items', type: 'alias', meta: { interface: 'list-o2m', special: ['o2m'], width: 'full', options: { template: '{{title}}', filter: { _and: [{ parent: { _null: true } }] } } }, schema: null },
  ],
});

await ensureCollection('navigation_items', {
  meta: { icon: 'link', group: 'Website', note: 'Menüpunkte (Seite, URL oder Untermenü)', display_template: '{{title}}', sort_field: 'sort', hidden: true, sort: 3 },
  schema: {},
  fields: [
    pkInt, sortField,
    { field: 'navigation', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true }, schema: {} },
    { field: 'title', type: 'string', meta: { interface: 'input', width: 'half', required: true }, schema: {} },
    { field: 'type', type: 'string', meta: { interface: 'select-radio', width: 'half', options: { choices: [
      { text: 'Seite', value: 'page' }, { text: 'URL', value: 'url' }, { text: 'Untermenü', value: 'submenu' },
    ] } }, schema: { default_value: 'page' } },
    m2oField('page', '{{title}}', { conditions: [{ name: 'Nur bei Typ Seite', rule: { type: { _neq: 'page' } }, hidden: true }] }),
    { field: 'url', type: 'string', meta: { interface: 'input', width: 'half', conditions: [{ name: 'Nur bei Typ URL', rule: { type: { _neq: 'url' } }, hidden: true }] }, schema: {} },
    boolField('open_in_new_tab', 'In neuem Tab öffnen'),
    { field: 'parent', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true, options: { template: '{{title}}' } }, schema: {} },
    { field: 'children', type: 'alias', meta: { interface: 'list-o2m', special: ['o2m'], width: 'full', options: { template: '{{title}}' }, conditions: [{ name: 'Nur bei Untermenü', rule: { type: { _neq: 'submenu' } }, hidden: true }] }, schema: null },
  ],
});

await ensureCollection('general', {
  meta: { icon: 'settings', group: 'Website', note: 'Globale Einstellungen (Singleton)', singleton: true, sort: 0 },
  schema: {},
  fields: [
    pkInt,
    m2oField('homepage', '{{title}}', { note: 'Diese Seite wird unter / ausgeliefert' }),
    fileField('logo', 'Logo (SVG bevorzugt)'),
    input('claim', 'Claim / Slogan (optional)'),
    input('contact_person', 'Ansprechpartner'),
    input('phone', 'Telefon'),
    input('fax', 'Fax'),
    input('email', 'E-Mail'),
    input('opening_hours', 'Kurzform für Header/Footer, z. B. "Mo–Fr 9–17 Uhr"'),
    { field: 'address', type: 'text', meta: { interface: 'input-rich-text-html', width: 'full', options: { toolbar: ['removeformat', 'code'] }, note: 'Straße<br>PLZ Ort' }, schema: {} },
    textarea('footer_text', 'Kurztext unter dem Logo im Footer'),
    { field: 'social_profiles', type: 'json', meta: { interface: 'list', special: ['cast-json'], width: 'full', note: 'Social-Media-Profile (Schema.org sameAs)', options: { fields: [
      { field: 'platform', name: 'Platform', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'url', name: 'URL', type: 'string', meta: { interface: 'input', width: 'half' } },
    ] } }, schema: {} },
  ],
});

await ensureCollection('redirects', {
  meta: {
    icon: 'alt_route', group: 'Website', note: 'Weiterleitungen alter URLs (server/middleware/redirects.ts, Cache ~5 min)', display_template: '{{from}} → {{to}}',
    archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true, sort: 5,
  },
  schema: {},
  fields: [
    pkInt, { ...statusField, schema: { ...statusField.schema, default_value: 'published' } }, ...auditFields,
    input('from', 'Alter Pfad mit führendem Slash, ohne Trailing-Slash, z. B. "/alte-seite"', { required: true, schema: { is_unique: true } }),
    input('to', 'Ziel: neuer Pfad (/neue-seite, gern mit #anker) oder absolute URL', { required: true }),
    select('code', [['301', '301 – dauerhaft'], ['302', '302 – temporär']], '301', 'HTTP-Statuscode'),
  ],
});

// ---------------------------------------------------------------- 3. Blöcke
console.log('\n[3/5] Blöcke');

await ensureCollection('block_text', {
  meta: { icon: 'notes', group: 'Blocks', note: 'Fließtext (Rechtstexte, Intros)', display_template: '{{heading}}', sort: 1 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('white'),
    input('heading', 'H2 (optional)', { width: 'full' }),
    richText('content', 'Inhalt'),
  ],
});

// Wiederholbare Einträge ohne Dateien (USPs, Schritte, FAQ, Stimmen) als JSON-Repeater direkt im Block
const repeater = (field, note, fields, template) => ({
  field, type: 'json',
  meta: { interface: 'list', special: ['cast-json'], width: 'full', note, options: { template, fields: fields.map(([name, iface = 'input', width = 'full']) => ({ field: name, name, type: iface === 'input' ? 'string' : 'text', meta: { interface: iface, width } })) } },
  schema: {},
});
const ctaFields = (prefix, note) => [input(`${prefix}_label`, `${note} – Beschriftung`), input(`${prefix}_url`, `${note} – Ziel (/seite, /#anker oder URL)`)];
const uuidM2o = (field, extra = {}) => ({ field, type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true, ...extra }, schema: {} });
const filesField = (field, note) => ({ field, type: 'alias', meta: { interface: 'files', special: ['files'], width: 'full', note }, schema: null });
const filesJunction = (collection, parentField, parentType) => ensureCollection(collection, {
  meta: { hidden: true, icon: 'import_export', group: 'Blocks', sort: 99 },
  schema: {},
  fields: [pkInt, { field: parentField, type: parentType, meta: { hidden: true }, schema: {} }, { field: 'directus_files_id', type: 'uuid', meta: { hidden: true }, schema: {} }, sortField],
});

await ensureCollection('block_hero', {
  meta: { icon: 'web_asset', group: 'Blocks', note: 'Seitenkopf: Badge, H1, Text, zwei CTAs, Bild', display_template: '{{heading}}', sort: 2 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('background'),
    input('badge', 'Kleines Label über der Überschrift (optional)'),
    input('heading', 'H1', { width: 'full', required: true }),
    textarea('text', 'Einleitung'),
    fileField('image', 'Bild oder Illustration'),
    ...ctaFields('cta', 'Haupt-Button'),
    ...ctaFields('cta2', 'Zweiter Button'),
  ],
});

await ensureCollection('block_features', {
  meta: { icon: 'checklist', group: 'Blocks', note: 'Kurzargumente mit Icon oder nummerierte Schritte', display_template: '{{heading}}', sort: 3 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('white'),
    input('heading', 'H2 (optional)', { width: 'full' }),
    textarea('intro', 'Einleitung (optional)'),
    select('variant', [['icons', 'Icons'], ['numbered', 'Nummerierte Schritte']], 'icons', 'Darstellung'),
    repeater('items', 'Einträge – Icon = Lucide-Name in PascalCase, z. B. "Truck" (nur bei Darstellung „Icons“)', [['icon', 'input', 'half'], ['title', 'input', 'half'], ['text', 'input-multiline']], '{{title}}'),
  ],
});

await ensureCollection('block_cards', {
  meta: { icon: 'dashboard', group: 'Blocks', note: 'Karten mit Bild, Text und Link (z. B. Leistungen)', display_template: '{{heading}}', sort: 4 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('white'),
    input('heading', 'H2 (optional)', { width: 'full' }),
    textarea('intro', 'Einleitung (optional)'),
    o2mField('items', '{{title}}'),
  ],
});

await ensureCollection('block_cards_items', {
  meta: { hidden: true, icon: 'crop_portrait', group: 'Blocks', display_template: '{{title}}', sort_field: 'sort', sort: 98 },
  schema: {},
  fields: [
    pkInt, sortField, uuidM2o('block'),
    fileField('image', 'Bild oder Illustration'),
    input('badge', 'Label (optional)'),
    input('title', 'Titel', { width: 'full', required: true }),
    textarea('text', 'Kurztext'),
    ...ctaFields('link', 'Link'),
  ],
});

await ensureCollection('block_text_media', {
  meta: { icon: 'vertical_split', group: 'Blocks', note: 'Text neben Bild (z. B. Über uns)', display_template: '{{heading}}', sort: 5 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('white'),
    input('heading', 'H2 (optional)', { width: 'full' }),
    richText('content', 'Inhalt'),
    fileField('image', 'Bild'),
    select('image_position', [['right', 'Bild rechts'], ['left', 'Bild links']], 'right', 'Bildposition (ab Tablet)'),
    ...ctaFields('cta', 'Button'),
  ],
});

await ensureCollection('block_gallery', {
  meta: { icon: 'photo_library', group: 'Blocks', note: 'Bildergalerie als Carousel', display_template: '{{heading}}', sort: 7 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('white'),
    input('heading', 'H2 (optional)', { width: 'full' }),
    textarea('intro', 'Einleitung (optional)'),
    filesField('images', 'Bilder – Alt-Text kommt aus dem Titel bzw. der Beschreibung der Datei'),
  ],
});
await filesJunction('block_gallery_files', 'block_gallery_id', 'uuid');

await ensureCollection('block_testimonials', {
  meta: { icon: 'format_quote', group: 'Blocks', note: 'Kundenstimmen', display_template: '{{heading}}', sort: 8 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('white'),
    input('heading', 'H2 (optional)', { width: 'full' }),
    repeater('items', 'Stimmen', [['quote', 'input-multiline'], ['name', 'input', 'half'], ['context', 'input', 'half']], '{{name}}'),
  ],
});

await ensureCollection('block_faq', {
  meta: { icon: 'quiz', group: 'Blocks', note: 'Häufige Fragen (Accordion, liefert FAQPage-Schema)', display_template: '{{heading}}', sort: 9 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('white'),
    input('heading', 'H2 (optional)', { width: 'full' }),
    textarea('intro', 'Einleitung (optional)'),
    repeater('items', 'Fragen', [['question'], ['answer', 'input-multiline']], '{{question}}'),
  ],
});

await ensureCollection('block_contact', {
  meta: { icon: 'mail', group: 'Blocks', note: 'Kontaktdaten aus „Globale Einstellungen“ + Anfrageformular (→ Anfragen)', display_template: '{{heading}}', sort: 10 },
  schema: {},
  fields: [
    pkUuid,
    ...blockCommon('background'),
    input('heading', 'H2 (optional)', { width: 'full' }),
    textarea('intro', 'Einleitung (optional)'),
  ],
});

// ---------------------------------------------------------------- 3b. Inhalts-Collections
console.log('\n[3b] Anfragen');

await ensureCollection('inquiries', {
  meta: { icon: 'inbox', note: 'Anfragen aus dem Kontaktformular (Block „Kontakt“)', display_template: '{{name}} – {{product}}', ...archiveMeta, archive_value: 'done', unarchive_value: 'new', sort: 4 },
  schema: {},
  fields: [
    pkInt,
    { field: 'status', type: 'string', meta: { interface: 'select-dropdown', width: 'half', display: 'labels', options: { choices: [{ text: 'Neu', value: 'new' }, { text: 'Erledigt', value: 'done' }] } }, schema: { default_value: 'new', is_nullable: false } },
    { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half', display: 'datetime', display_options: { relative: true } }, schema: {} },
    input('name', 'Name', { required: true }),
    input('email', 'E-Mail', { required: true }),
    input('phone', 'Telefon'),
    input('product', 'Angefragtes Produkt / Anlass'),
    textarea('message', 'Nachricht'),
    boolField('privacy', 'Datenschutzhinweis akzeptiert'),
  ],
});

// ---------------------------------------------------------------- 4. Relationen
console.log('\n[4/5] Relationen');
await ensureRelation({ collection: 'seo', field: 'og_image', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } });
await ensureRelation({ collection: 'pages', field: 'seo', related_collection: 'seo', schema: { on_delete: 'SET NULL' } });
await ensureRelation({ collection: 'pages_blocks', field: 'pages_id', related_collection: 'pages', meta: { one_field: 'blocks', sort_field: 'sort', junction_field: 'item', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'navigation_items', field: 'navigation', related_collection: 'navigation', meta: { one_field: 'items', sort_field: 'sort', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'navigation_items', field: 'page', related_collection: 'pages', schema: { on_delete: 'SET NULL' } });
await ensureRelation({ collection: 'navigation_items', field: 'parent', related_collection: 'navigation_items', meta: { one_field: 'children', sort_field: 'sort', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'general', field: 'homepage', related_collection: 'pages', schema: { on_delete: 'SET NULL' } });
await ensureRelation({ collection: 'general', field: 'logo', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } });

// Blöcke + Produkte: Dateien, O2M-Karten, M2M-Bilder (Junction → Block/Produkt + → directus_files)
for (const [collection, field] of [['block_hero', 'image'], ['block_text_media', 'image'], ['block_cards_items', 'image']]) {
  await ensureRelation({ collection, field, related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } });
}
await ensureRelation({ collection: 'block_cards_items', field: 'block', related_collection: 'block_cards', meta: { one_field: 'items', sort_field: 'sort', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } });
for (const [junction, parentField, parent] of [['block_gallery_files', 'block_gallery_id', 'block_gallery']]) {
  await ensureRelation({ collection: junction, field: parentField, related_collection: parent, meta: { one_field: 'images', sort_field: 'sort', junction_field: 'directus_files_id', one_deselect_action: 'delete' }, schema: { on_delete: 'CASCADE' } });
  await ensureRelation({ collection: junction, field: 'directus_files_id', related_collection: 'directus_files', meta: { junction_field: parentField }, schema: { on_delete: 'CASCADE' } });
}

// Alle Block-Collections, die im Page Builder (pages.blocks) erlaubt sind – neue Blöcke hier eintragen.
export const BLOCK_COLLECTIONS = [
  'block_text', 'block_hero', 'block_features', 'block_cards', 'block_text_media',
  'block_gallery', 'block_testimonials', 'block_faq', 'block_contact',
];
await ensureM2ARelation({
  collection: 'pages_blocks', field: 'item', related_collection: null,
  meta: { one_allowed_collections: BLOCK_COLLECTIONS, one_collection_field: 'collection', junction_field: 'pages_id', sort_field: 'sort', one_deselect_action: 'delete' },
});

// ---------------------------------------------------------------- 5. Public-Leserechte
console.log('\n[5/5] Public-Leserechte (Nuxt liest anonym)');
await ensurePublicRead('general');
await ensurePublicRead('navigation');
await ensurePublicRead('navigation_items');
await ensurePublicRead('pages', { permissions: { status: { _eq: 'published' } } });
await ensurePublicRead('pages_blocks');
await ensurePublicRead('seo');
await ensurePublicRead('redirects', { permissions: { status: { _eq: 'published' } } });
await ensurePublicRead('directus_files');
for (const block of BLOCK_COLLECTIONS) await ensurePublicRead(block);
for (const sub of ['block_cards_items', 'block_gallery_files']) await ensurePublicRead(sub);
// Kontaktformular: anonym anlegen, nie lesen – status/date_created setzt Directus selbst
await ensurePublicCreate('inquiries', { fields: ['name', 'email', 'phone', 'product', 'message', 'privacy'] });

console.log('\nFertig – Schema steht.\n');
