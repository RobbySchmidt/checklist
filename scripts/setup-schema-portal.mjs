// scripts/setup-schema-portal.mjs
// Teil 2: Portal-Nutzer, Login-Tokens, Seitenaufrufe, Zusatzfelder, Rolle „App“ mit Token. Idempotent. Aufruf: yarn directus:schema:portal
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { ensureCollection, ensureField, ensureRelation, ensureRole, ensurePolicy, ensureRoleHasPolicy, ensurePermission, removePublicPermission, ensureAppUser } from './lib/directus-admin.mjs';
import { pkUuid, input, textarea, boolField, intField, dateField, select } from './lib/fields.mjs';

const uuidM2o = (field, template, note, extra = {}) => ({ field, type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', note, options: { template }, ...extra }, schema: {} });
const timestamp = (field, note, extra = {}) => ({ field, type: 'timestamp', meta: { interface: 'datetime', width: 'half', note, ...extra }, schema: {} });
const jsonTags = (field, note) => ({ field, type: 'json', meta: { interface: 'tags', width: 'full', note, options: { alphabetize: true, lowercase: true } }, schema: {} });

console.log('\n[1/5] Zusatzfelder');
await ensureField('employers', 'domains', jsonTags('domains', 'Hostnamen dieses Dienstes, kleingeschrieben, ohne Port (z. B. sonnenhof.pflege-jobs.de)'));
await ensureField('employers', 'notify_reminders', boolField('notify_reminders', 'Erinnerung nach 24 Stunden ohne Rückruf', true));
await ensureField('employers', 'report_email', input('report_email', 'Empfänger Monatsreport (sonst Bewerbungs-E-Mail)'));
await ensureField('employers', 'template_invite', textarea('template_invite', 'Vorlage Einladung. Platzhalter: {name} {stelle} {dienst} {ansprechperson} {telefon}'));
await ensureField('employers', 'template_reject', textarea('template_reject', 'Vorlage Absage. Gleiche Platzhalter'));
await ensureField('applications', 'email', input('email', 'E-Mail (optional)'));
await ensureField('applications', 'first_contact_at', timestamp('first_contact_at', 'Erster Statuswechsel weg von Neu', { readonly: true }));
await ensureField('applications', 'reminder_sent_at', timestamp('reminder_sent_at', 'Erinnerung verschickt', { readonly: true }));
await ensureField('applications', 'note', textarea('note', 'Interne Notiz des Dienstes'));

console.log('\n[2/5] Collections');
await ensureCollection('portal_users', {
  meta: { group: 'Recruiting', icon: 'person', note: 'Zugänge zum Kundenportal', display_template: '{{name}} ({{email}})', sort: 4 },
  schema: {},
  fields: [
    pkUuid,
    select('status', [['active', 'Aktiv'], ['disabled', 'Deaktiviert']], 'active', 'Status'),
    input('email', 'E-Mail, kleingeschrieben', { required: true, schema: { is_unique: true } }),
    input('name', 'Name', { required: true }),
    select('role', [['dienst', 'Pflegedienst'], ['rhowerk', 'Rhowerk']], 'dienst', 'Rolle'),
    uuidM2o('employer', '{{name}}', 'Pflegedienst (Pflicht bei Rolle Pflegedienst)'),
    timestamp('last_login', 'Letzter Login', { readonly: true }),
  ],
});
await ensureField('portal_users', 'password_hash', input('password_hash', 'Passwort-Hash (per yarn portal:password setzen)', { hidden: true, width: 'full' }));
await ensureCollection('login_tokens', {
  meta: { group: 'Recruiting', icon: 'key', note: 'Magic-Link-Tokens (nur Hash)', hidden: true, sort: 5 },
  schema: {},
  fields: [
    pkUuid,
    uuidM2o('user', '{{email}}', 'Nutzer', { required: true }),
    input('token_hash', 'SHA-256 des Tokens', { required: true, schema: { is_unique: true } }),
    timestamp('expires_at', 'Gültig bis', { required: true }),
    timestamp('used_at', 'Benutzt am'),
    { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half' }, schema: {} },
  ],
});
await ensureCollection('job_views', {
  meta: { group: 'Recruiting', icon: 'visibility', note: 'Aufrufe pro Stelle, Quelle und Tag', hidden: true, sort: 6 },
  schema: {},
  fields: [
    pkUuid,
    uuidM2o('job', '{{title}}', 'Stelle', { required: true }),
    uuidM2o('employer', '{{name}}', 'Pflegedienst', { required: true }),
    select('source', [['google', 'Google'], ['wa', 'WhatsApp'], ['qr', 'QR-Aushang'], ['direct', 'Direkt']], 'direct', 'Quelle'),
    dateField('day', 'Tag', { required: true }),
    intField('count', 'Aufrufe', { required: true }),
  ],
});

console.log('\n[3/5] Relationen');
await ensureRelation({ collection: 'portal_users', field: 'employer', related_collection: 'employers', schema: { on_delete: 'SET NULL' } });
await ensureRelation({ collection: 'login_tokens', field: 'user', related_collection: 'portal_users', schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'job_views', field: 'job', related_collection: 'jobs', schema: { on_delete: 'CASCADE' } });
await ensureRelation({ collection: 'job_views', field: 'employer', related_collection: 'employers', schema: { on_delete: 'CASCADE' } });

console.log('\n[4/5] Rechte');
await removePublicPermission('applications', 'create');
const roleId = await ensureRole('App');
const policyId = await ensurePolicy('App', { app_access: false });
await ensureRoleHasPolicy(roleId, policyId);
const EMPLOYER_PORTAL_FIELDS = ['name', 'legal_name', 'logo', 'color_primary', 'color_secondary', 'address_street', 'address_zip', 'address_city', 'phone', 'website', 'apply_email', 'apply_whatsapp', 'service_area', 'about', 'schedule_model', 'benefits', 'notify_reminders', 'report_email', 'template_invite', 'template_reject'];
await ensurePermission(policyId, 'employers', 'read');
await ensurePermission(policyId, 'employers', 'update', { fields: EMPLOYER_PORTAL_FIELDS });
await ensurePermission(policyId, 'jobs', 'read');
await ensurePermission(policyId, 'jobs', 'create');
await ensurePermission(policyId, 'jobs', 'update');
await ensurePermission(policyId, 'applications', 'read');
await ensurePermission(policyId, 'applications', 'create');
await ensurePermission(policyId, 'applications', 'update', { fields: ['status', 'note', 'first_contact_at', 'reminder_sent_at'] });
await ensurePermission(policyId, 'job_views', 'read');
await ensurePermission(policyId, 'job_views', 'create');
await ensurePermission(policyId, 'job_views', 'update', { fields: ['count'] });
await ensurePermission(policyId, 'portal_users', 'read');
await ensurePermission(policyId, 'portal_users', 'update', { fields: ['last_login'] });
await ensurePermission(policyId, 'login_tokens', 'read');
await ensurePermission(policyId, 'login_tokens', 'create');
await ensurePermission(policyId, 'login_tokens', 'update', { fields: ['used_at'] });
await ensurePermission(policyId, 'login_tokens', 'delete');
await ensurePermission(policyId, 'directus_files', 'read');
await ensurePermission(policyId, 'directus_files', 'create');

console.log('\n[5/5] App-User und Token');
let token = process.env.DIRECTUS_APP_TOKEN;
if (!token) {
  token = randomBytes(32).toString('base64url');
  const env = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
  const line = `DIRECTUS_APP_TOKEN=${token}`;
  const sep = env && !env.endsWith('\n') ? '\n' : '';
  const next = /^DIRECTUS_APP_TOKEN=.*$/m.test(env) ? env.replace(/^DIRECTUS_APP_TOKEN=.*$/m, () => line) : `${env}${sep}${line}\n`;
  writeFileSync('.env', next);
  console.log('  + DIRECTUS_APP_TOKEN erzeugt und in .env eingetragen');
}
await ensureAppUser(roleId, 'app@pflege-jobs.example.com', token);
console.log('\nFertig.\n');
