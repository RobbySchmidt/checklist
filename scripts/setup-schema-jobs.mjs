// scripts/setup-schema-jobs.mjs
// Collections für Stellenseiten: employers (Pflegedienste), jobs (Stellen), applications (Bewerbungen).
// Idempotent, läuft nach scripts/setup-schema.mjs. Aufruf: yarn directus:schema:jobs
import { updateRelation, readRelation, deleteRelation, createRelation } from '@directus/sdk';
import { directus, ensureCollection, ensureRelation, ensurePublicRead, ensurePublicCreate } from './lib/directus-admin.mjs';
import { pkUuid, statusField, auditFields, input, slugField, textarea, richText, fileField, boolField, intField, dateField, select } from './lib/fields.mjs';

const uuidM2o = (field, template, note, extra = {}) => ({
  field, type: 'uuid',
  meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', note, options: { template }, ...extra },
  schema: {},
});
const jsonList = (field, note, fields, template) => ({
  field, type: 'json',
  meta: { interface: 'list', width: 'full', note, options: { fields, template } },
  schema: {},
});
const decimalField = (field, note, extra = {}) => ({ field, type: 'decimal', meta: { interface: 'input', width: 'half', note, ...extra }, schema: { numeric_precision: 10, numeric_scale: 2 } });
const timestampField = (field, note) => ({ field, type: 'timestamp', meta: { interface: 'datetime', width: 'half', note, readonly: true }, schema: {} });

const jobStatus = {
  field: 'status', type: 'string',
  meta: {
    interface: 'select-dropdown', width: 'half', display: 'labels',
    options: { choices: [
      { text: 'Veröffentlicht', value: 'published', color: '#2ECDA7' },
      { text: 'Entwurf', value: 'draft', color: '#FFC23B' },
      { text: 'Besetzt', value: 'filled', color: '#A2B5CD' },
      { text: 'Abgelaufen', value: 'expired', color: '#A2B5CD' },
    ] },
  },
  schema: { default_value: 'draft', is_nullable: false },
};

console.log('\n[1/4] Ordner');
await ensureCollection('Recruiting', { meta: { icon: 'work', note: 'Pflegedienste, Stellen, Bewerbungen', sort: 0, collapse: 'open' }, schema: null });

console.log('\n[2/4] Collections');
await ensureCollection('employers', {
  meta: { group: 'Recruiting', icon: 'local_hospital', note: 'Pflegedienste (ein Dienst = ein Mandant)', display_template: '{{name}}', sort: 1 },
  schema: {},
  fields: [
    pkUuid, statusField, ...auditFields,
    input('name', 'Name des Dienstes, z. B. „AWO Pflegedienst Leipzig-Süd"', { required: true }),
    slugField('slug', 'Kurzname für URLs und EMPLOYER_SLUG', { required: true }),
    input('legal_name', 'Rechtsträger (hiringOrganization), falls abweichend'),
    fileField('logo', 'Logo, quadratisch oder breit, PNG/SVG'),
    input('color_primary', 'Hauptfarbe als Hex, z. B. #1d6b57'),
    input('color_secondary', 'Zweitfarbe als Hex'),
    input('address_street', 'Straße und Hausnummer des Büros', { required: true }),
    input('address_zip', 'PLZ', { required: true }),
    input('address_city', 'Stadt', { required: true }),
    input('phone', 'Telefon, wie er auf der Seite stehen soll'),
    input('website', 'Website des Dienstes (https://…)'),
    input('apply_email', 'Empfänger für Bewerbungen', { required: true }),
    input('apply_whatsapp', 'WhatsApp-Nummer international ohne Plus, z. B. 491511234567'),
    input('service_area', 'Einsatzgebiet als Text, z. B. „Leipzig-Süd, Markkleeberg, Zwenkau"', { width: 'full' }),
    textarea('about', 'Kurzer Absatz über den Dienst, erscheint auf jeder Stellenseite'),
    textarea('schedule_model', 'Dienstplan-Modell, z. B. „Wunschdienstplan, max. 7 Tage am Stück"'),
    jsonList('benefits', 'Benefits', [
      { field: 'label', name: 'Benefit', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'detail', name: 'Detail (optional)', type: 'string', meta: { interface: 'input', width: 'half' } },
    ], '{{label}}'),
    boolField('is_demo', 'Demo-Dienst: zeigt überall den Hinweis „Demo-Daten, fiktiver Pflegedienst"'),
  ],
});

await ensureCollection('jobs', {
  meta: { group: 'Recruiting', icon: 'badge', note: 'Offene Stellen', display_template: '{{title}} – {{employer.name}}', sort: 2 },
  schema: {},
  fields: [
    pkUuid, jobStatus, ...auditFields,
    uuidM2o('employer', '{{name}}', 'Pflegedienst', { required: true }),
    input('title', 'Stellentitel, z. B. „Pflegefachkraft (m/w/d)"', { required: true }),
    input('slug', 'URL-Teil, eindeutig pro Dienst', { required: true, options: { slug: true, trim: true } }),
    { field: 'employment_types', type: 'json', meta: { interface: 'select-multiple-checkbox', width: 'half', note: 'Beschäftigungsart (Google-Werte)', options: { choices: [
      { text: 'Vollzeit', value: 'FULL_TIME' }, { text: 'Teilzeit', value: 'PART_TIME' }, { text: 'Befristet', value: 'TEMPORARY' },
      { text: 'Ausbildung / Praktikum', value: 'INTERN' }, { text: 'Freie Mitarbeit', value: 'CONTRACTOR' }, { text: 'Sonstiges', value: 'OTHER' },
    ] } }, schema: {} },
    intField('hours_min', 'Wochenstunden mindestens'),
    intField('hours_max', 'Wochenstunden höchstens'),
    input('start_note', 'Start, z. B. „ab sofort" oder „01.12.2026"'),
    decimalField('salary_min', 'Gehalt von (brutto)'),
    decimalField('salary_max', 'Gehalt bis (brutto)'),
    select('salary_unit', [['MONTH', 'pro Monat'], ['HOUR', 'pro Stunde']], 'MONTH', 'Gehaltseinheit'),
    input('salary_note', 'Hinweis zum Gehalt, z. B. „nach TVöD-P plus Zulagen"', { width: 'full' }),
    { field: 'location_override', type: 'json', meta: { interface: 'input-code', width: 'full', note: 'Optional: abweichender Einsatzort als JSON { "street": "", "zip": "", "city": "" } – nur komplett ausfüllen', options: { language: 'json' } }, schema: {} },
    textarea('intro', 'Einleitung, 2–3 Sätze'),
    richText('tasks', 'Aufgaben'),
    richText('requirements', 'Voraussetzungen'),
    jsonList('benefits_override', 'Benefits nur für diese Stelle (sonst die des Dienstes)', [
      { field: 'label', name: 'Benefit', type: 'string', meta: { interface: 'input', width: 'half' } },
      { field: 'detail', name: 'Detail (optional)', type: 'string', meta: { interface: 'input', width: 'half' } },
    ], '{{label}}'),
    input('contact_name', 'Ansprechperson'),
    dateField('date_posted', 'Veröffentlicht am', { required: true }),
    dateField('valid_through', 'Gültig bis (danach 404 und raus aus Google)', { required: true }),
    input('apply_email_override', 'Abweichender Empfänger für Bewerbungen'),
    timestampField('google_indexed_at', 'Zuletzt bei Google gemeldet (setzt scripts/google-index.mjs)'),
  ],
});

await ensureCollection('applications', {
  meta: { group: 'Recruiting', icon: 'inbox', note: 'Bewerbungen (Public darf nur anlegen)', display_template: '{{name}} – {{job.title}}', sort: 3 },
  schema: {},
  fields: [
    pkUuid,
    select('status', [['neu', 'Neu'], ['kontaktiert', 'Kontaktiert'], ['gespraech', 'Gespräch'], ['zusage', 'Zusage'], ['absage', 'Absage']], 'neu', 'Stand'),
    { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half', display: 'datetime', display_options: { relative: true } }, schema: {} },
    uuidM2o('job', '{{title}}', 'Stelle', { required: true }),
    uuidM2o('employer', '{{name}}', 'Pflegedienst', { required: true }),
    input('name', 'Name', { required: true }),
    input('phone', 'Telefon', { required: true }),
    select('qualification', [['pflegefachkraft', 'Pflegefachkraft'], ['pflegehilfskraft', 'Pflegehilfskraft'], ['betreuungskraft_43b', 'Betreuungskraft § 43b'], ['auszubildende', 'Auszubildende/r'], ['hauswirtschaft', 'Hauswirtschaft'], ['sonstiges', 'Sonstiges']], 'sonstiges', 'Qualifikation'),
    select('hours_wish', [['vollzeit', 'Vollzeit'], ['teilzeit_30', 'Teilzeit ca. 30 h'], ['teilzeit_20', 'Teilzeit ca. 20 h'], ['minijob', 'Minijob'], ['offen', 'Offen']], 'offen', 'Wunschstunden'),
    input('earliest_start', 'Frühester Start'),
    textarea('message', 'Nachricht'),
    select('source', [['google', 'Google'], ['wa', 'WhatsApp'], ['qr', 'QR-Aushang'], ['direct', 'Direkt'], ['demo', 'Demo']], 'direct', 'Quelle'),
    boolField('consent', 'Einwilligung erteilt'),
    input('user_agent', 'Browser', { width: 'full' }),
    input('referrer', 'Referrer', { width: 'full' }),
  ],
});

console.log('\n[3/4] Relationen');
await ensureRelation({ collection: 'employers', field: 'logo', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } });
await ensureRelation({ collection: 'jobs', field: 'employer', related_collection: 'employers', meta: { one_field: 'jobs' }, schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'applications', field: 'job', related_collection: 'jobs', meta: { one_field: 'applications' }, schema: { on_delete: 'RESTRICT' } });
await ensureRelation({ collection: 'applications', field: 'employer', related_collection: 'employers', schema: { on_delete: 'RESTRICT' } });
// ensureRelation überspringt bestehende Relationen, und ensureCollection legt für m2o-Felder nur die Relation-Meta ohne
// Fremdschlüssel an (schema: null). Bewerbungen sollen beim Löschen von Stelle/Dienst nicht still verschwinden:
// Fehlt der Fremdschlüssel, Relation neu anlegen (nur Meta + FK, Daten bleiben); sonst on_delete patchen.
const restrictRelations = [
  { field: 'job', related_collection: 'jobs', meta: { one_field: 'applications' } },
  { field: 'employer', related_collection: 'employers' },
];
for (const { field, related_collection, meta } of restrictRelations) {
  const current = await directus.request(readRelation('applications', field));
  if (current.schema?.on_delete === 'RESTRICT') {
    console.log(`  = Relation applications.${field}: on_delete RESTRICT`);
    continue;
  }
  if (current.schema) {
    await directus.request(updateRelation('applications', field, { schema: { on_delete: 'RESTRICT' } }));
  } else {
    await directus.request(deleteRelation('applications', field));
    await directus.request(createRelation({ collection: 'applications', field, related_collection, ...(meta ? { meta } : {}), schema: { on_delete: 'RESTRICT' } }));
  }
  console.log(`  ~ Relation applications.${field}: on_delete RESTRICT`);
}

console.log('\n[4/4] Rechte');
await ensurePublicRead('employers', { permissions: { status: { _eq: 'published' } } });
await ensurePublicRead('jobs', { permissions: { _and: [{ status: { _eq: 'published' } }, { valid_through: { _gte: '$NOW' } }] } });
await ensurePublicCreate('applications', { fields: ['job', 'employer', 'name', 'phone', 'qualification', 'hours_wish', 'earliest_start', 'message', 'source', 'consent', 'user_agent', 'referrer'],
  // _submitted: Directus-Validierung lässt fehlende Felder sonst durch (nur gesendete Werte werden geprüft)
  validation: {
    _and: [
      ...['consent', 'name', 'phone', 'job', 'employer'].map((f) => ({ [f]: { _submitted: true } })),
      { consent: { _eq: true } }, { name: { _nnull: true } }, { phone: { _nnull: true } }, { job: { _nnull: true } }, { employer: { _nnull: true } },
    ],
  },
});

console.log('\nFertig.\n');
