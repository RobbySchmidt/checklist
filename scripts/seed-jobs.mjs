// scripts/seed-jobs.mjs
// Demo-Dienst „Pflegedienst Sonnenhof Leipzig" (fiktiv, is_demo) mit zwei Stellen. Idempotent (Dienst per slug, Stellen per slug).
// Alle Namen, Adressen und Kontaktdaten sind erfunden. Aufruf: yarn directus:seed:jobs
import { upsertItem } from './lib/directus-admin.mjs';

const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plusDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

console.log('\n[1/2] Demo-Dienst');
const employerId = await upsertItem('employers', { slug: 'sonnenhof-leipzig' }, {
  status: 'published',
  name: 'Pflegedienst Sonnenhof Leipzig',
  slug: 'sonnenhof-leipzig',
  domains: ['sonnenhof.localhost'],
  legal_name: 'Sonnenhof Pflege GmbH (fiktiv)',
  color_primary: '#1d6b57',
  color_secondary: '#dcefe7',
  address_street: 'Bornaische Straße 12',
  address_zip: '04277',
  address_city: 'Leipzig',
  phone: '0341 000000',
  website: 'https://sonnenhof.example',
  apply_email: process.env.NOTIFY_BCC || 'demo@example.com',
  service_area: 'Leipzig-Süd, Connewitz, Markkleeberg, Zwenkau',
  about: 'Wir sind ein ambulanter Pflegedienst mit 38 Kolleginnen und Kollegen. Wir pflegen zu Hause, planen Touren so, dass Zeit für Menschen bleibt, und reden offen über Dienstpläne.',
  schedule_model: 'Wunschdienstplan vier Wochen im Voraus, höchstens sieben Dienste am Stück, jedes zweite Wochenende frei.',
  benefits: [
    { label: 'Gehalt nach TVöD-P', detail: 'plus Zulagen und Jahressonderzahlung' },
    { label: 'Dienstwagen auch privat', detail: 'nach der Probezeit' },
    { label: '30 Tage Urlaub' },
    { label: 'Fortbildung bezahlt', detail: 'inklusive Freistellung' },
  ],
  is_demo: true,
}, 'sonnenhof-leipzig');

console.log('\n[2/2] Stellen');
await upsertItem('jobs', { slug: 'pflegefachkraft' }, {
  status: 'published', employer: employerId,
  title: 'Pflegefachkraft (m/w/d)', slug: 'pflegefachkraft',
  employment_types: ['FULL_TIME', 'PART_TIME'], hours_min: 20, hours_max: 39, start_note: 'ab sofort',
  salary_min: 3400, salary_max: 3900, salary_unit: 'MONTH', salary_note: 'brutto bei Vollzeit, nach TVöD-P 7, plus Zulagen',
  intro: 'Du willst pflegen, nicht hetzen? Bei uns hast du feste Touren, ein Team, das sich kennt, und einen Dienstplan, der hält.',
  tasks: '<ul><li>Grund- und Behandlungspflege in der Häuslichkeit</li><li>Pflegeplanung und Dokumentation</li><li>Beratung von Angehörigen</li><li>Zusammenarbeit mit Hausärzten</li></ul>',
  requirements: '<ul><li>Examen als Pflegefachkraft, Altenpfleger/in oder Gesundheits- und Krankenpfleger/in</li><li>Führerschein Klasse B</li><li>Freude am Umgang mit Menschen</li></ul>',
  contact_name: 'Pflegedienstleitung Frau Beispiel',
  date_posted: iso(plusDays(-3)), valid_through: iso(plusDays(60)),
}, 'pflegefachkraft');

await upsertItem('jobs', { slug: 'pflegehilfskraft' }, {
  status: 'published', employer: employerId,
  title: 'Pflegehilfskraft (m/w/d)', slug: 'pflegehilfskraft',
  employment_types: ['PART_TIME'], hours_min: 20, hours_max: 30, start_note: 'ab sofort',
  salary_min: 2600, salary_max: 2900, salary_unit: 'MONTH', salary_note: 'brutto bei 30 Stunden',
  intro: 'Du hast ein Herz für Menschen und willst in der Pflege anfangen oder weitermachen? Wir arbeiten dich ein.',
  tasks: '<ul><li>Unterstützung bei der Grundpflege</li><li>Hauswirtschaftliche Hilfe</li><li>Begleitung im Alltag</li></ul>',
  requirements: '<ul><li>Erfahrung in der Pflege oder Pflegebasiskurs</li><li>Führerschein Klasse B</li><li>Zuverlässigkeit</li></ul>',
  contact_name: 'Pflegedienstleitung Frau Beispiel',
  date_posted: iso(plusDays(-10)), valid_through: iso(plusDays(60)),
}, 'pflegehilfskraft');

console.log('\nFertig.\n');
