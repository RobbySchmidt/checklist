// scripts/seed-content.mjs
// Grundinhalt: general, Impressum, Datenschutz (Platzhalter), Menüs. Idempotent (Seiten per Slug, Menüs per Titel).
// Demo-Dienst und Stellen legt scripts/seed-jobs.mjs an.
// Aufruf: yarn directus:seed   (braucht DIRECTUS_URL + DIRECTUS_ADMIN_TOKEN in .env)
import { directus, upsertItem, readItems, createItem, deleteItems, updateSingleton } from './lib/directus-admin.mjs';

const SITE_NAME = process.env.SITE_NAME || 'Pflege-Jobs';
const block = (collection, data) => ({ collection, data });

async function upsertPage(slug, data, blocks) {
  // upsertItem liefert die ID (nicht das Item)
  const pageId = await upsertItem('pages', { slug }, { status: 'published', slug, ...data }, slug);
  const existing = await directus.request(readItems('pages_blocks', { filter: { pages_id: { _eq: pageId } }, fields: ['id', 'collection', 'item'], limit: -1 }));
  if (existing.length) await directus.request(deleteItems('pages_blocks', existing.map((b) => b.id)));
  for (const [collection, items] of Object.entries(groupBy(existing, 'collection'))) {
    await directus.request(deleteItems(collection, items.map((b) => b.item)));
  }
  let sort = 1;
  for (const b of blocks) {
    const item = await directus.request(createItem(b.collection, b.data));
    await directus.request(createItem('pages_blocks', { pages_id: pageId, collection: b.collection, item: item.id, sort: sort++ }));
  }
  return { id: pageId };
}
const groupBy = (arr, key) => arr.reduce((acc, x) => ((acc[x[key]] ??= []).push(x), acc), {});

console.log('\n[1/3] Seiten');
const impressum = await upsertPage('impressum', { title: 'Impressum' }, [
  block('block_text', { heading: 'Impressum', content: '<p>Angaben gemäß § 5 DDG – bitte im CMS ausfüllen.</p>', background: 'white', paddingBottom: true }),
]);
const datenschutz = await upsertPage('datenschutz', { title: 'Datenschutz' }, [
  block('block_text', { heading: 'Datenschutzerklärung', content: '<p>Bitte im CMS ausfüllen. Bewerbungsdaten werden ausschließlich zur Kontaktaufnahme durch den Pflegedienst verarbeitet.</p>', background: 'white', paddingBottom: true }),
]);
const start = await upsertPage('startseite', { title: 'Startseite' }, [
  block('block_text', { heading: SITE_NAME, content: '<p>Offene Stellen finden Sie unter <a href="/jobs">/jobs</a>.</p>', background: 'white', paddingBottom: true }),
]);

console.log('\n[2/3] Menüs');
async function upsertMenu(title, items) {
  const found = await directus.request(readItems('navigation', { filter: { title: { _eq: title } }, fields: ['id'], limit: 1 }));
  const nav = found[0] ?? await directus.request(createItem('navigation', { title }));
  const old = await directus.request(readItems('navigation_items', { filter: { navigation: { _eq: nav.id } }, fields: ['id'], limit: -1 }));
  if (old.length) await directus.request(deleteItems('navigation_items', old.map((i) => i.id)));
  let sort = 1;
  for (const it of items) await directus.request(createItem('navigation_items', { navigation: nav.id, sort: sort++, ...it }));
  console.log(`  ~ Menü ${title}`);
}
await upsertMenu('Main', [{ title: 'Offene Stellen', type: 'url', url: '/jobs' }]);
await upsertMenu('Footer', [{ title: 'Offene Stellen', type: 'url', url: '/jobs' }]);
await upsertMenu('Legal', [{ title: 'Impressum', type: 'page', page: impressum.id }, { title: 'Datenschutz', type: 'page', page: datenschutz.id }]);

console.log('\n[3/3] general');
await directus.request(updateSingleton('general', { homepage: start.id, claim: 'Bewerbungen vom Handy, in einer Minute.' }));
console.log('\nFertig.\n');
