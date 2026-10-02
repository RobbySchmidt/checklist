import { C } from '../shared/utils/collections.ts';
// Zwei Portal-Nutzer: ein Rhowerk-Admin (DEMO_EMAIL, sonst NOTIFY_BCC, sonst admin@example.com) und ein Dienst-Nutzer für den Demo-Dienst. Idempotent per E-Mail.
import { upsertItem, directus } from './lib/directus-admin.mjs';
import { readItems } from '@directus/sdk';
const admin = (process.env.DEMO_EMAIL || process.env.NOTIFY_BCC || 'admin@example.com').toLowerCase();
const [demo] = await directus.request(readItems(C.employers, { filter: { slug: { _eq: 'sonnenhof-leipzig' } }, fields: ['id'], limit: 1 }));
await upsertItem(C.portalUsers, { email: admin }, { status: 'active', email: admin, name: 'Rhowerk', role: 'rhowerk', employer: null }, admin);
if (demo) await upsertItem(C.portalUsers, { email: 'pdl@sonnenhof.example' }, { status: 'active', email: 'pdl@sonnenhof.example', name: 'Frau Beispiel', role: 'dienst', employer: demo.id }, 'pdl@sonnenhof.example');
console.log('Fertig.');
