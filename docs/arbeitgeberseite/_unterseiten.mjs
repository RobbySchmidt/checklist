// Erzeugt die Unterseiten der AWO-Arbeitgeberseite (Entwurf D6): standorte/*.html und stellen/*.html.
// Aufruf: node docs/arbeitgeberseite/_unterseiten.mjs
// Inhalte stammen von awo-blk.de (Stand 3. Okt 2026); gelb markiert (.todo) = von der AWO zu ergänzen.
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const HOME = '../awo-arbeitgeberseite-d6.html'

const arrow = '<svg class="group-hover:translate-x-1 duration-300 ease-in-out" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
const back = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>'
const tel = (n) => 'tel:+49' + n.replace(/\s/g, '').replace(/^0/, '')

// ---------- Daten ----------

const standorte = {
  hohenmoelsen: {
    ort: 'Hohenmölsen',
    name: 'Alten- und Pflegeheim',
    lead: '80 Seniorinnen und Senioren, mitten im Zentrum von Hohenmölsen. Seit 2001 in einem Haus mit Cafeteria, Friseursalon und eigenem Speiseraum.',
    hero: ['hohenmoelsen-luft.jpg', 'Hohenmölsen aus der Luft im Abendlicht, in der Mitte das AWO Alten- und Pflegeheim'],
    jobHero: ['hm-tablet.jpg', 'Zwei Kolleginnen im Pflegeheim Hohenmölsen schauen gemeinsam auf ein Tablet', '30%_50%'],
    text: [
      'Das Haus wurde am 5. Januar 2001 eröffnet und liegt zentral in Hohenmölsen. Weißenfels ist der nächste größere Ort, Leipzig liegt 35 Kilometer entfernt, die A9 und die A38 sind in der Nähe.',
      'Gepflegt wird nach dem Bedürfnismodell von Monika Krohwinkel, mit dem Schwerpunkt auf fördernder Prozesspflege. Ziel ist, dass die Bewohnerinnen und Bewohner so selbstständig wie möglich bleiben.',
    ],
    fotos: [['hm-team-drei.jpg', 'Drei Mitarbeitende des Pflegeheims', 'Ein Teil des Teams', '45%_50%'], ['hm-spiel.jpg', 'Pflegekräfte bereiten Getränke und ein Brettspiel vor', 'Nachmittag im Speiseraum', '40%_50%'], ['hm-flur.jpg', 'Ein Pfleger schiebt einen Rollstuhl durch den Flur', 'Unterwegs im Haus', '65%_50%']],
    adresse: ['Clara-Zetkin-Straße 20', '06679 Hohenmölsen'],
    telefon: '034441 44530',
    kontakt: 'Frau Witt, Geschäftsstelle',
    stellen: ['pflegefachkraft-hohenmoelsen'],
  },
  zeitz: {
    ort: 'Zeitz',
    name: 'Ambulanter Pflegedienst und Tagespflege',
    lead: 'Häusliche Pflege in Zeitz, Hohenmölsen, Teuchern und Umgebung. Dazu die Tagespflege in der Zeitzer Aue, montags bis freitags von 8 bis 16 Uhr.',
    hero: ['ambulant-auto.jpg', 'Ein Mitarbeiter des ambulanten Pflegedienstes steht mit Tablet neben dem Dienstwagen'],
    text: [
      'Der ambulante Pflegedienst pflegt Menschen dort, wo sie zu Hause sind. Das Team arbeitet eng mit Ärzten, Apotheken, Physiotherapeuten, Krankenhäusern und Sanitätshäusern zusammen.',
      'Die Tagespflege wurde im Mai 2017 in einem historischen Gebäude in der Zeitzer Aue eröffnet. Die Gäste kommen morgens, frühstücken gemeinsam, essen zu Mittag und fahren nachmittags nach Hause, auf Wunsch mit dem Hol- und Bringedienst.',
    ],
    fotos: [['tp-kamin.jpg', 'Aufenthaltsraum der Tagespflege mit Kamin und Sesseln', 'Tagespflege, am Kamin', '50%_50%'], ['tp-flur.jpg', 'Eine Mitarbeiterin begleitet einen Gast mit Gehstock über den Flur', 'Tagespflege, im Flur', '55%_50%'], ['tp-aufstehen.jpg', 'Ein Mitarbeiter hilft einem Gast mit einer Aufstehhilfe', 'Tagespflege, Aufstehhilfe', '45%_50%']],
    adresse: ['Weißenfelser Straße 1', '06712 Zeitz'],
    telefon: '03441 72577820',
    kontakt: 'Ambulanter Pflegedienst',
    stellen: ['pflegefachkraft-zeitz'],
  },
  naumburg: {
    ort: 'Naumburg',
    name: 'Seniorenzentrum „Am Rosengarten“',
    lead: '63 Bewohnerinnen und Bewohner in einem denkmalgeschützten Haus von 1929, umgeben von Garten und Bäumen. Hier bilden wir aus.',
    hero: ['rosengarten-luft.jpg', 'Seniorenzentrum Am Rosengarten in Naumburg von oben, umgeben von Bäumen'],
    jobHero: ['rg-haus.jpg', 'Das denkmalgeschützte Gebäude des Seniorenzentrums Am Rosengarten', '50%_50%'],
    text: [
      'Das Gebäude wurde 1929 als „Posttöchterhort“ eingeweiht und diente später als Fachschule für Post- und Zeitungswesen. Nach zehn Jahren Leerstand hat die AWO es übernommen und umgebaut, am 2. April 2004 wurde das Seniorenzentrum eröffnet.',
      'Zwei Wohnbereiche verteilen sich auf vier Etagen, auf den ersten beiden liegen große Gemeinschaftsräume für Veranstaltungen. Träger ist die AWO Seniorenzentrum „Am Rosengarten“ gGmbH.',
    ],
    fotos: [['rg-haus.jpg', 'Das denkmalgeschützte Gebäude des Seniorenzentrums Am Rosengarten', 'Das Haus von 1929', '50%_50%'], ['rg-garten.jpg', 'Garten mit Teich und Bäumen am Seniorenzentrum', 'Der Garten', '50%_50%'], ['rg-ziegen.jpg', 'Zwei Ziegen im Gehege werden mit Heu gefüttert', 'Die Ziegen im Gehege', '55%_50%']],
    adresse: ['Neidschützer Straße 31', '06618 Naumburg'],
    telefon: '03445 232501',
    kontakt: 'Seniorenzentrum „Am Rosengarten“',
    stellen: ['pflegefachkraft-naumburg', 'ausbildung-pflegefachkraft-naumburg'],
  },
}

const stellen = {
  'pflegefachkraft-hohenmoelsen': {
    titel: 'Pflegefachkraft', standort: 'hohenmoelsen', start: 'ab sofort',
    intro: 'Zur Unterstützung unseres Teams im Alten- und Pflegeheim Hohenmölsen suchen wir zum nächstmöglichen Zeitpunkt eine Pflegefachkraft.',
    meta: ['ab sofort', 'Wunschdienstplan', '<span class="todo">Umfang und Gehalt ergänzen</span>'],
    profil: ['Examen in der Alten- oder Krankenpflege', 'Soziale Kompetenz, Zuverlässigkeit und Teamfähigkeit', 'Einfühlsamer Umgang mit älteren Menschen und Kolleginnen und Kollegen', 'Ein offenes, freundliches Auftreten gegenüber Bewohnern, Angehörigen und Besuchern', 'Pflege, Assistenz und Betreuung der Bewohner aller Pflegestufen', 'Berufserfahrung ist erwünscht, aber nicht zwingend'],
    angebot: ['Ein sicherer Job und eine wertschätzende Unternehmenskultur', 'Bezahlung über dem Durchschnitt, Gehaltserhöhung jedes Jahr', 'Wunschdienstpläne und 30 Tage Urlaub', 'Betriebliche Altersvorsorge und jährliche Sonderzahlung', 'Entwicklungs- und Fortbildungsmöglichkeiten', 'Digitale Pflegedokumentation'],
  },
  'pflegefachkraft-zeitz': {
    titel: 'Pflegefachkraft', standort: 'zeitz', start: 'ab sofort',
    intro: 'Zur Unterstützung des Teams unseres ambulanten Pflegedienstes suchen wir zum nächstmöglichen Zeitpunkt eine Pflegefachkraft.',
    meta: ['ab sofort', 'Wunschdienstplan', '<span class="todo">Umfang und Gehalt ergänzen</span>'],
    profil: ['Examen in der Alten- oder Krankenpflege', 'Soziale Kompetenz, Zuverlässigkeit und Teamfähigkeit', 'Einfühlsamer Umgang mit älteren Menschen und Kolleginnen und Kollegen', 'Ein offenes, freundliches Auftreten gegenüber Pflegebedürftigen und Angehörigen', 'Berufserfahrung ist erwünscht, aber nicht zwingend'],
    angebot: ['Ein sicherer Job und eine wertschätzende Unternehmenskultur', 'Bezahlung über dem Durchschnitt, Gehaltserhöhung jedes Jahr', 'Wunschdienstpläne und 30 Tage Urlaub', 'Regelmäßige, kostenlose physiotherapeutische Massagen', 'Betriebliche Altersvorsorge und jährliche Sonderzahlung', 'Entwicklungs- und Fortbildungsmöglichkeiten', 'Digitale Pflegedokumentation'],
  },
  'pflegefachkraft-naumburg': {
    titel: 'Pflegefachkraft', standort: 'naumburg', start: 'ab sofort',
    intro: 'Zur Unterstützung unseres Teams im Seniorenzentrum „Am Rosengarten“ suchen wir zum nächstmöglichen Zeitpunkt eine Pflegefachkraft, unbefristet, in Vollzeit oder Teilzeit.',
    meta: ['ab sofort', 'Vollzeit oder Teilzeit', 'unbefristet', 'nach Tarif'],
    profil: ['Examen in der Alten- oder Krankenpflege', 'Soziale Kompetenz, Zuverlässigkeit und Teamfähigkeit', 'Einfühlsamer Umgang mit älteren Menschen', 'Ein offenes, freundliches Auftreten gegenüber Bewohnern, Angehörigen und Besuchern', 'Pflege, Assistenz und Betreuung der Bewohner aller Pflegegrade', 'Grundkenntnisse am Computer', 'Bereitschaft zu Schicht-, Sonn- und Feiertagsdienst', 'Berufserfahrung ist erwünscht, aber nicht zwingend'],
    angebot: ['Ein vielseitiger, abwechslungsreicher Arbeitsplatz', 'Ein fachlich hoch qualifiziertes, freundliches Team', 'Umfangreiche Fortbildungsmöglichkeiten', 'Vergütung nach Tarif mit Jahressonderzahlung und betrieblicher Altersvorsorge', 'Ein unbefristeter Arbeitsvertrag'],
  },
  'ausbildung-pflegefachkraft-naumburg': {
    titel: 'Ausbildung Pflegefachfrau / Pflegefachmann', standort: 'naumburg', start: 'Start 1. August',
    intro: 'Im Seniorenzentrum „Am Rosengarten“ leben 63 Bewohnerinnen und Bewohner auf vier Etagen. Wir suchen Auszubildende zur Pflegefachfrau oder zum Pflegefachmann, mit Übernahmegarantie.',
    meta: ['Start 1. August <span class="todo">Jahr bestätigen</span>', 'Übernahmegarantie', '30 Tage Urlaub'],
    profil: ['Freude an der Arbeit mit pflegebedürftigen Menschen jeden Alters', 'Ein offenes und freundliches Auftreten gegenüber Bewohnern, Angehörigen und Besuchern', 'Einsatzbereitschaft, Zuverlässigkeit, Teamfähigkeit und Einfühlungsvermögen', 'Belastbarkeit und Empathie'],
    angebot: ['Ein vielseitiger und interessanter Ausbildungsplatz', 'Ein fachlich hoch qualifiziertes und sympathisches Team', 'Übernahmegarantie nach erfolgreich abgeschlossener Ausbildung', 'Gute Bezahlung, Aufstiegsmöglichkeiten, betriebliche Altersvorsorge und 30 Tage Urlaub'],
  },
}

// ---------- Bausteine ----------

const page = (title, body) => `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} – AWO Burgenlandkreis (Entwurf)</title>
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style>
  @font-face { font-family: Sebino; font-weight: 400; font-display: swap; src: url(../fonts/sebino-400.woff2) format("woff2"); }
  @font-face { font-family: Sebino; font-weight: 700; font-display: swap; src: url(../fonts/sebino-700.woff2) format("woff2"); }
  .select { appearance: none; padding-right: 3rem; background: #fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2301233a%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E") no-repeat right 1rem center; }
</style>
<style type="text/tailwindcss">
  /* Erzeugt von _unterseiten.mjs – gleiches Theme wie awo-arbeitgeberseite-d6.html */
  @theme {
    --color-primary: #e3001b;
    --color-secondary: #01233a;
    --font-sans: Sebino, sans-serif;
    --text-f-4xl: clamp(1.75rem, 1.62rem + 0.66vw, 2.25rem);
    --text-f-6xl: clamp(2.25rem, 1.8rem + 1.9vw, 3.75rem);
    --spacing-f-24: clamp(3rem, 2.21rem + 3.95vw, 6rem);
  }
  html { @apply scroll-smooth scroll-pt-20; }
  body { @apply text-secondary bg-white; }
  .todo { @apply bg-[#fff3c4] text-[#5c4300] text-sm px-1.5; }
  .field { @apply h-14 w-full border-2 border-secondary/15 bg-white px-4 text-lg outline-none focus:border-secondary duration-300 ease-in-out; }
</style>
</head>
<body>
<div class="bg-[#fff3c4] text-[#5c4300] text-sm px-4 py-2 text-center">Entwurf, intern. Texte und Fotos von awo-blk.de, gelb markiert = von der AWO zu ergänzen.</div>

<header class="sticky top-0 z-50 bg-white border-b-2 border-secondary">
  <nav class="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
    <a href="${HOME}"><img src="../img/awo-logo.svg" alt="AWO Kreisverband Burgenlandkreis e. V., zur Startseite" class="h-10 w-auto"></a>
    <ul class="hidden lg:flex items-center gap-8">
      <li><a href="${HOME}#vorteile" class="hover:text-primary duration-300 ease-in-out">Was wir bieten</a></li>
      <li><a href="${HOME}#stellen" class="hover:text-primary duration-300 ease-in-out">Stellen</a></li>
      <li><a href="${HOME}#team" class="hover:text-primary duration-300 ease-in-out">Team</a></li>
      <li><a href="${HOME}#fragen" class="hover:text-primary duration-300 ease-in-out">Fragen</a></li>
      <li><a href="tel:+493444144530" class="font-bold hover:text-primary duration-300 ease-in-out">034441 44530</a></li>
    </ul>
  </nav>
</header>

<main>
${body}
</main>

<footer class="max-w-6xl mx-auto px-4">
  <div class="py-6 border-t-2 border-secondary flex flex-col md:flex-row md:justify-between gap-4 text-sm">
    <p class="opacity-75">AWO Kreisverband Burgenlandkreis e. V. · Clara-Zetkin-Straße 20 · 06679 Hohenmölsen</p>
    <ul class="flex gap-6">
      <li><a href="https://awo-blk.de/" class="opacity-75 hover:opacity-100 duration-300 ease-in-out">awo-blk.de</a></li>
      <li><a href="https://awo-blk.de/impressum" class="opacity-75 hover:opacity-100 duration-300 ease-in-out">Impressum</a></li>
      <li><a href="https://awo-blk.de/datenschutz" class="opacity-75 hover:opacity-100 duration-300 ease-in-out">Datenschutz</a></li>
    </ul>
  </div>
</footer>
</body>
</html>
`

const section = (title, inner, { id = '', first = false } = {}) => `  <div${id ? ` id="${id}"` : ''} class="max-w-6xl mx-auto px-4">
    <div class="${first ? '' : 'border-t-2 border-secondary '}py-f-24 space-y-10">
      <h2 class="text-f-4xl">${title}</h2>
${inner}
    </div>
  </div>`

const backlink = (href, label) => `<a href="${href}" class="inline-flex items-center gap-2 opacity-75 hover:opacity-100 duration-300 ease-in-out">${back}<span>${label}</span></a>`

const hero = ({ img, alt, pos = '50%_50%', crumb, h1, sub, meta = [], lead, cta }) => `  <div class="grid lg:grid-cols-[1fr_minmax(0,36rem)_minmax(0,36rem)_1fr] lg:min-h-128">
    <div class="relative lg:col-start-3 lg:col-end-5 lg:row-start-1">
      <img src="../img/${img}" alt="${alt}" class="block w-full aspect-video object-cover object-[${pos}] lg:absolute lg:inset-0 lg:h-full lg:aspect-auto">
    </div>
    <div class="px-4 py-f-24 lg:pr-12 lg:col-start-2 lg:row-start-1 lg:self-center space-y-4">
      <div class="pb-4">${crumb}</div>
      <h1 class="text-f-6xl leading-tight">${h1}</h1>
      ${sub ? `<p class="text-xl opacity-75">${sub}</p>` : ''}
      ${meta.length ? `<p class="flex flex-wrap gap-x-2 text-lg">${meta.map((m) => `<span>${m}</span>`).join('<span class="opacity-50">·</span>')}</p>` : ''}
      <p class="text-xl">${lead}</p>
      <a href="${cta[0]}" class="bg-primary text-white py-3 px-6 text-lg flex items-center gap-1.5 font-bold w-fit group mt-12"><span>${cta[1]}</span>${arrow}</a>
    </div>
  </div>`

const list = (items) => `      <ul class="grid md:grid-cols-2 gap-x-6 border-b-2 border-secondary/15">
${items.map((t) => `        <li class="border-t-2 border-secondary/15 py-4 text-lg">${t}</li>`).join('\n')}
      </ul>`

const jobCards = (slugs) => `      <ul class="grid md:grid-cols-2 gap-x-6">
${slugs.map((slug) => { const j = stellen[slug], s = standorte[j.standort]; return `        <li><a href="../stellen/${slug}.html" class="group h-full flex flex-col gap-6 border-t-2 border-secondary/15 py-6">
          <h3 class="grid"><span class="text-3xl mb-1 group-hover:text-primary duration-300 ease-in-out">${j.titel}</span><span class="text-xl opacity-75">(m/w/d)</span></h3>
          <div class="grid text-lg"><span>${s.name}, ${s.ort}</span><span class="opacity-75">${j.start}</span></div>
          <div class="mt-auto flex items-center gap-1.5 font-bold text-primary"><span>mehr erfahren</span>${arrow}</div>
        </a></li>` }).join('\n')}
      </ul>`

const form = (s, stelle) => `      <p class="text-xl max-w-3xl">Kein Lebenslauf, kein Anschreiben. Sie hinterlassen Ihre Nummer, ${s.kontakt === 'Frau Witt, Geschäftsstelle' ? 'Frau Witt' : 'die Leitung der Einrichtung'} ruft Sie innerhalb von 24 Stunden zurück.</p>
      <form class="grid md:grid-cols-2 gap-4 max-w-3xl" onsubmit="event.preventDefault()">
        <input type="hidden" name="stelle" value="${stelle}">
        <label class="grid gap-1.5"><span class="text-sm opacity-75">Ihr Name</span><input type="text" autocomplete="name" class="field"></label>
        <label class="grid gap-1.5"><span class="text-sm opacity-75">Ihre Telefonnummer</span><input type="tel" inputmode="tel" autocomplete="tel" class="field"></label>
        <label class="grid gap-1.5 md:col-span-2"><span class="text-sm opacity-75">Qualifikation</span><select class="field select"><option>Bitte wählen</option><option>Pflegefachkraft</option><option>Pflegehilfskraft</option><option>Ausbildung gesucht</option><option>Quereinstieg</option></select></label>
        <label class="md:col-span-2 flex gap-3 items-start pt-2"><input type="checkbox" class="size-5 mt-0.5 accent-primary shrink-0"><span class="opacity-75">Die AWO darf mich zu dieser Bewerbung anrufen. Mehr in der <a href="https://awo-blk.de/datenschutz" class="underline">Datenschutzerklärung</a>.</span></label>
        <div class="md:col-span-2 flex flex-wrap items-center gap-x-8 gap-y-4 mt-6">
          <button type="submit" class="bg-primary text-white py-3 px-6 text-lg flex items-center gap-1.5 font-bold w-fit group cursor-pointer"><span>Rückruf anfordern</span>${arrow}</button>
          <span><span class="opacity-75">oder anrufen:</span> <a href="${tel(s.telefon)}" class="font-bold hover:text-primary duration-300 ease-in-out">${s.telefon}</a></span>
        </div>
      </form>`

const contact = (s) => `      <div class="space-y-1 pt-6">
        <p class="text-xl">Fragen zur Einrichtung? Rufen Sie an: <a href="${tel(s.telefon)}" class="font-bold hover:text-primary duration-300 ease-in-out">${s.telefon}</a></p>
        <p class="opacity-75">${s.kontakt}, ${s.adresse.join(', ')}</p>
      </div>`

// ---------- Seiten ----------

const out = (rel, html) => { const f = resolve(here, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); console.log('geschrieben:', rel) }

for (const [key, s] of Object.entries(standorte)) {
  const body = [
    hero({ img: s.hero[0], alt: s.hero[1], crumb: backlink(`${HOME}#arbeitsorte`, 'Alle Arbeitsorte'), h1: s.name, sub: s.ort, lead: s.lead, cta: ['#stellen', 'Stellen hier'] }),
    section('Die Einrichtung', `      <div class="max-w-3xl space-y-6 text-xl">${s.text.map((p) => `<p>${p}</p>`).join('')}</div>`, { first: true }),
    section('Einblicke', `      <ul class="grid grid-cols-1 md:grid-cols-3 gap-6">
${s.fotos.map(([f, alt, cap, pos]) => `        <li class="space-y-3"><img src="../img/${f}" alt="${alt}" class="block w-full aspect-[4/3] object-cover object-[${pos}]"><p class="text-sm opacity-75">${cap}</p></li>`).join('\n')}
      </ul>`),
    section(`Offene Stellen in ${s.ort}`, `${jobCards(s.stellen)}
${contact(s)}`, { id: 'stellen' }),
  ].join('\n\n')
  out(`standorte/${key}.html`, page(`${s.name} ${s.ort}`, body))
}

for (const [slug, j] of Object.entries(stellen)) {
  const s = standorte[j.standort]
  // Bild bei „Ihr Arbeitsort“: nicht dasselbe wie im Kopf
  const ortBild = s.jobHero ? [s.hero[0], s.hero[1], '50%_50%'] : [s.fotos[0][0], s.fotos[0][1], s.fotos[0][3]]
  const body = [
    hero({ img: (s.jobHero || s.hero)[0], alt: (s.jobHero || s.hero)[1], pos: s.jobHero?.[2], crumb: backlink(`${HOME}#stellen`, 'Alle Stellen'), h1: `${j.titel} <span class="opacity-75 text-f-4xl block">(m/w/d)</span>`, sub: `${s.name}, ${s.ort}`, meta: j.meta, lead: j.intro, cta: ['#bewerben', 'In einer Minute bewerben'] }),
    section('Das bringen Sie mit', list(j.profil), { first: true }),
    section('Das bieten wir', list(j.angebot)),
    section('Ihr Arbeitsort', `      <a href="../standorte/${j.standort}.html" class="group grid md:grid-cols-2 gap-6 items-center">
        <img src="../img/${ortBild[0]}" alt="${ortBild[1]}" class="block w-full aspect-[4/3] object-cover object-[${ortBild[2]}]">
        <div class="space-y-4"><div class="grid"><span class="text-2xl group-hover:text-primary duration-300 ease-in-out">${s.name}</span><span class="opacity-75">${s.adresse.join(', ')}</span></div><p class="text-lg">${s.lead}</p><span class="flex items-center gap-1.5 font-bold text-primary">Mehr über ${s.ort}${arrow}</span></div>
      </a>`),
    section('In einer Minute bewerben', form(s, slug), { id: 'bewerben' }),
  ].join('\n\n')
  out(`stellen/${slug}.html`, page(`${j.titel} in ${s.ort}`, body))
}
