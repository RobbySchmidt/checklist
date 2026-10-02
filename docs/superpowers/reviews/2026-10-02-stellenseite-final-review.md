# Final-Review: Stellenseite für Pflegedienste, Teil 1

**Range:** 16df9b3..225cb04 (Branch `stellenseite`), zusätzlich die vom Agenten geänderten Dateien aus 16df9b3
**Reviewer:** Opus, read-only, ein Durchgang in zwei Pässen (Diff komplett, dann Bootstrap-Dateien und Laufzeitprüfungen)
**Eigene Prüfungen:** `yarn test` (22/22 grün); `vue-tsc --noEmit` für `.nuxt/tsconfig.app.json` (2 Fehler, beide vorbestehend im Base-Repo: `Website/Footer.vue`, `ui/chart/index.ts`) und `.nuxt/tsconfig.server.json` (0 Fehler); anonyme Lese-Requests gegen die laufende lokale Directus-Instanz (keine Schreibzugriffe).

Laufzeit-Belege:
- `GET /items/applications` als Public liefert `FORBIDDEN`. Die Bewerbungen sind also nicht öffentlich lesbar.
- `filter[date_posted][_gte]=$NOW(-3 days)` liefert die Stelle mit `date_posted = heute-3`. Directus vergleicht `$NOW` bei `date`-Feldern also nach Datum. Die Public-Policy `valid_through >= $NOW` lässt eine Stelle am letzten Gültigkeitstag sichtbar, so wie es Review-Focus 1 verlangt.

---

## Stärken

- **Domäne sauber getrennt:** `shared/utils/jobs.ts`, `buildJobPosting.ts`, `jobPostingCheck.ts`, `applicationSchema.ts` und `share.ts` sind rein (keine Nuxt-Imports) und werden von Browser, Server und Tests gemeinsam genutzt. `buildJobPosting` ist die einzige Quelle für Stellenseite, Google-Vorschau und Prüfbericht, wie die Spec es verlangt.
- **Review Focus abgedeckt:** Mitternacht über reinen `YYYY-MM-DD`-Stringvergleich mit Test (`jobs.test.ts`), Gehalt nur mit `salary_min` und ohne `maxValue` mit Test, Neuladen der Stelle in `/api/apply` vor dem Speichern, Telefon-Schreibweisen mit Test, unvollständiger Override fällt komplett auf die Dienstadresse zurück, mit Test.
- **Sicherheit im Detail:** `v-html` nur über `sanitizeHtml()`. Das Mail-HTML wird durchgehend escaped. `/__mail/[id]` ist doppelt geschützt (nur `import.meta.dev`, UUID-Regex, also keine Pfad-Traversal). Der Slug in `/api/qr` wird per Regex geprüft. `previewId` geht nur im Dev-Modus an den Client. Die Quelle wird serverseitig für `is_demo` auf `demo` gezwungen. `employer` wird serverseitig aus der Stelle gesetzt, nicht vom Client übernommen.
- **Spec-Treue an den heiklen Stellen:** Banner und Seitentitel „Vorschau Jobbox“ sind vorhanden, keine Wortmarke. `noindex` liegt auf Aushang und Vorschau, beide fehlen in der Sitemap. Die Sitemap filtert sichtbare Stellen mit derselben Regel. Ohne SMTP gibt es den Fallback mit Log und Datei. Das Rate-Limit liegt bei 5 pro Stunde.
- **Hydration bedacht:** Das Prüfbericht-Panel liegt in `<ClientOnly>`. `useHead` steht in `useEmployer` vor dem `await`. Das JSON-LD wird im SSR gerendert, weil `watchEffect` dort einmal sofort läuft.
- **Umzugsfähigkeit:** Das Schema entsteht ausschließlich über `scripts/setup-schema-jobs.mjs` und nutzt die Base-Helfer. Die Bereinigung von `setup-schema.mjs` und `seed-content.mjs` (Produkte und `block_products` entfernt, Grundinhalt mit Menüs auf `/jobs`) ist vollständig. Es gibt keine Reste in Code oder Seed.

---

## Befunde

### Critical (Must Fix)

Keine.

### Important (Should Fix)

**I1. `server/api/apply.post.ts:33`: Ausfall von Directus wird zu „Stelle nicht mehr verfügbar“**
- **Was:** `.catch(() => ({ data: [] }))` macht aus Timeout, Netzwerkfehler oder 5xx eine leere Liste. Daraus folgt 404, und das Formular zeigt „Diese Stelle ist inzwischen nicht mehr verfügbar.“
- **Warum:** Die Spec (Fehlerbehandlung) verlangt bei einem Ausfall „Gerade nicht möglich, bitte rufen Sie an: {Telefon}“. Eine Bewerberin bekommt bei einer kurzen CMS-Störung stattdessen die falsche Auskunft, dass die Stelle weg ist, und ruft deshalb nicht an. Damit geht genau die Bewerbung verloren, um die es geht. Die Ursache steht schon im Plan (Zeile 1701).
- **Fix:** Nur bei einer erfolgreichen Antwort ohne Treffer 404 liefern. Bei einem Fetch-Fehler `createError({ statusCode: 503 })` werfen. Der Client landet dann bereits im `else`-Zweig mit der Telefonnummer.

**I2. `app/composables/useEmployer.ts:19` und `app/error.vue:6`: Kein 503 bei nicht erreichbarem Directus**
- **Was:** Bei einem Netzwerkfehler wirft `getItems` (nuxt-directus) `createError({ statusCode: err.response?.status })`, also ohne Status, was 500 ergibt. Das passiert außerhalb von `useAsyncData`, die Stellenseite liefert also 500. `error.vue` zeigt dann „500 – Seite nicht gefunden“. Das gilt auch für den gewollten 503 „Dienst nicht konfiguriert“: Die Seite zeigt dann „503 – Seite nicht gefunden“.
- **Warum:** Die Spec verlangt 503 mit kurzem Hinweis. „Seite nicht gefunden“ ist bei einem Ausfall irreführend. Für Google ist 503 das richtige Signal für „vorübergehend“, 500 oder 404 nicht.
- **Fix:** Den Fetch in `useEmployer` in try/catch fassen und bei Fehlern `createError({ statusCode: 503, fatal: true })` werfen. `error.vue` braucht für 5xx einen eigenen Text, etwa „Gerade nicht erreichbar, bitte später erneut versuchen“, wenn der Dienst bekannt ist mit Telefonnummer.

**I3. `scripts/setup-schema-jobs.mjs:127-128`: `on_delete: CASCADE` löscht Bewerbungen mit**
- **Was:** Wird eine Stelle oder ein Dienst gelöscht, löscht die Datenbank still alle zugehörigen `applications`.
- **Warum:** In Directus ist eine alte Stelle schnell gelöscht statt auf `filled` gesetzt. Dabei verschwinden alle Bewerberdaten unwiederbringlich, ohne Rückfrage, die über das normale Löschen hinausgeht. Teil 2 (Bewerber-Liste, Monatsreport) baut genau auf diesen Datensätzen auf. Wer mit diesem Werkzeug arbeitet, erwartet, dass Bewerbungen das Schließen einer Stelle überleben. Die Ursache steht im Plan (Zeilen 403-404). Weil Teil 2 „nichts umbauen“ soll, ist jetzt der günstigste Moment für den Fix.
- **Fix:** `applications.job` und `applications.employer` auf `SET NULL` setzen, bei Bedarf mit `is_nullable: true` auf DB-Ebene, oder auf `NO ACTION`/`RESTRICT`, damit Löschen scheitert, solange Bewerbungen hängen. Bei der bestehenden lokalen Instanz prüfen, ob `ensureRelation` das `on_delete` einer schon vorhandenen Relation nachzieht. Falls nicht, das im Skript ergänzen (nicht von Hand im UI).

**I4. `scripts/setup-schema-jobs.mjs:133` und `server/api/apply.post.ts:16`: Die Schutzmaßnahmen von `/api/apply` sind umgehbar**
- **Was:** (a) Weil `applications` für Public anlegbar ist, kann jeder direkt `POST {DIRECTUS_URL}/items/applications` aufrufen, und die Directus-URL steht im Client-Bundle. Honeypot, Rate-Limit, zod-Prüfung, Sichtbarkeitsprüfung, `consent: true` und die serverseitige Zuordnung von `employer` greifen dann nicht. Dazu kommt: Bei so angelegten Datensätzen geht keine Mail raus. (b) `getRequestIP(event, { xForwardedFor: true })` nimmt den ersten Eintrag von `X-Forwarded-For`, und den bestimmt der Client. Ein wechselnder Header hebelt das Limit „5 pro IP und Stunde“ aus.
- **Warum:** Das ist zu einem großen Teil eine Entscheidung aus Spec und Plan („Item per Public-Create anlegen“). Die Wirkung ist trotzdem real: Spam-Bewerbungen und Datensätze mit falschem `employer`, die in Teil 2 in der Liste eines fremden Dienstes auftauchen würden. Datenabfluss gibt es nicht, weil Public nichts lesen darf (verifiziert).
- **Fix (mindestens):** In `ensurePublicCreate` Validierungsregeln der Directus-Policy setzen (`consent _eq true`, `source _in [...]`, `name`/`phone` `_nempty`). Beim Rate-Limit die vertrauenswürdige Client-IP der Plattform nehmen (Netlify: `x-nf-client-connection-ip`) oder `xForwardedFor` nur hinter bekanntem Proxy aktivieren. **Besser, als Ruling für Teil 2:** Public bekommt kein Create mehr. `/api/apply` schreibt mit einem eigenen Token, das nur `applications` anlegen darf.

### Minor (Nice to Have)

- **M1. `app/pages/jobs/[slug]/index.vue:69` und `server/api/__sitemap__/pages.ts:26`: Demo-Dienst ist indexierbar.** Läuft eine Instanz mit `EMPLOYER_SLUG=sonnenhof-leipzig` öffentlich (etwa für einen Live-Rich-Results-Test), bekommt Google fiktive Stellen mit gültigem JobPosting angeboten. Das verstößt gegen Googles Richtlinien für Stellenanzeigen. Fix: Bei `employer.is_demo` `robots: 'noindex'` setzen und die Stellen nicht in die Sitemap aufnehmen.
- **M2. `app/components/jobs/ApplyForm.vue:4`: Bestätigungstext weicht von der Spec ab.** Implementiert ist „Danke, {Name}! {Dienst} meldet sich … bei dir“, die Spec sagt „Danke, {Dienstname} meldet sich innerhalb von 24 Stunden.“ Die Abweichung kommt aus dem Plan (Zeile 1763). Dazu kommt ein Mix aus Du und Sie: Das Formular sagt „du“, die Fehlertexte, `/jobs` und `error.vue` sagen „Sie“. Eine Ansprache festlegen.
- **M3. `app/pages/jobs/[slug]/google-vorschau.vue:18-19`: Hinweistext nicht exakt wörtlich.** Die Spec setzt „**Was sich nicht simulieren lässt:** ob Google …“ (fett, Doppelpunkt, klein weiter). Implementiert sind eine Überschrift ohne Doppelpunkt und „Ob Google“ groß. Inhaltlich ist alles gleich, die Abweichung kommt aus dem Plan (Zeile 2092). Wenn „wörtlich“ ernst gemeint ist: `<p><strong>Was sich nicht simulieren lässt:</strong> ob Google …</p>`.
- **M4. `app/components/jobs/JobPostingCheckPanel.vue:17` und `shared/utils/jobPostingCheck.ts`:** Laut Spec soll der Link zum Rich-Results-Test die aktuelle URL tragen (`?url=` mit `encodeURIComponent(location.href)`). Außerdem fehlt `addressCountry` in der Pflichtliste. Heute ist das folgenlos, weil der Wert fest auf `DE` steht.
- **M5. `server/utils/notify.ts`:** `toLocaleString('de-DE', …)` läuft ohne `timeZone: 'Europe/Berlin'`. Auf einem UTC-Server (Netlify) zeigt die Mail eine um 1-2 Stunden falsche Eingangszeit. Fehlt SMTP in Produktion, landen die vollen Bewerberdaten (Name, Telefon, Nachricht) im Server-Log (Zeile 63), und es geht keine Mail raus. In Produktion sollte stattdessen laut gewarnt und kein Klartext geloggt werden.
- **M6. `app/pages/jobs/[slug]/google-vorschau.vue:48`:** `daysAgo` rechnet mit `Date.now()` und `Math.round`. Liegen SSR und Hydration um die halbe-Tag-Grenze, droht ein Hydration-Mismatch („vor 2“ gegen „vor 3 Tagen“). Besser aus `toIsoDate(new Date())` und `date_posted` als ganze Tage rechnen.
- **M7. `shared/utils/buildJobPosting.ts:17-19`:** `intro` geht ohne Escaping in `<p>…</p>`, `tasks`/`requirements` gehen unsanitisiert ins JSON-LD-`description`. Die Eingaben stammen von Redakteuren, das Risiko ist also gering. Konsistenter wäre derselbe `sanitizeHtml`-Weg wie auf der Seite und ein Escaping von `intro`.
- **M8. `scripts/seed-jobs.mjs:23`:** `apply_email: process.env.NOTIFY_BCC || 'demo@example.com'` weicht von der Spec ab (`demo@example.com`). Ist `NOTIFY_BCC` gesetzt, wird die Rhowerk-Adresse über die Public-Read-API von `employers` öffentlich lesbar, und jede Demo-Bewerbung geht doppelt an Rhowerk (to und bcc). Lokal ist es aktuell `demo@example.com`, geprüft.
- **M9. `server/api/apply.post.ts:38`:** Ist der Dienst einer sichtbaren Stelle nicht `published`, liefert die Public-Read `employer: null`. `job.employer.is_demo` wirft dann einen TypeError, die Folge ist 500. Lieber `if (!job?.employer) 404` prüfen.
- **M10. `app/pages/jobs/[slug]/index.vue:7`:** Der Sticky-Button liegt mobil auch dann über dem Formular und der Fußzeile, wenn man schon beim Formular ist. Es gibt keinen Abstand nach unten. Fix: Den Button ausblenden, solange `#bewerben` sichtbar ist (IntersectionObserver), oder `pb-24` am Seitenende.
- **M11. `app/layouts/default.vue:9`:** Der Demo-Hinweis steht unter dem Header statt „in der Fußzeile“ (Spec) und fehlt auf dem Aushang (Layout `bare`). Ein gedruckter Demo-Aushang trägt also keine Kennzeichnung. Die Position ist vertretbar (eher besser sichtbar), auf dem Aushang fehlt der Hinweis aber.
- **M12. `app/composables/useEmployer.ts`:** Layout (`DemoNotice`) und Seite rufen `useEmployer()` parallel auf. Beide sehen `employer.value === null`, und es gehen zwei identische Requests pro SSR-Aufruf raus. Fix: das Promise in einer modulweiten Variable bzw. per `useAsyncData('employer')` deduplizieren.
- **M13. `package.json:18` und `CLAUDE.md:16`:** `yarn google:index` zeigt auf eine nicht existierende Datei, mit `MODULE_NOT_FOUND` als Folge. Im README ist das erklärt. Ein Stub mit Hinweis und Exit 0 wäre freundlicher. In CLAUDE.md nennt der Block-Katalog noch „Produkte“.
- **M14. `shared/utils/jobs.ts` (`toIsoDate`):** Das Datum ist serverlokal. Auf einem UTC-Host bleibt eine abgelaufene Stelle bis 02:00 Uhr deutscher Zeit sichtbar. `validThrough` geht als reines Datum an Google, das als Tagesbeginn gelesen werden kann, während die Seite den ganzen Tag sichtbar bleibt. Abhilfe: `validThrough` als `YYYY-MM-DDT23:59:59+01:00/+02:00` ausgeben oder die Zeitzone fest auf `Europe/Berlin` setzen.
- **M15. `server/utils/rateLimit.ts`:** Die Map wird nie aufgeräumt. Schlüssel ohne Folgeanfrage bleiben für immer liegen. Bei einer Instanz unkritisch, ein gelegentlicher Sweep wäre trotzdem besser.
- **M16. `scripts/setup-schema-jobs.mjs:131-132`:** Public-Read gibt alle Felder frei, auch `apply_email_override` und `google_indexed_at`. Die Felder sollten auf das beschränkt werden, was Seiten und Sitemap brauchen. Außerdem prüft die `jobs`-Policy nicht den Status des Dienstes.
- **M17. `app/error.vue:32`:** `useRoute()` wird innerhalb von `computed` aufgerufen. Das funktioniert, weil es beim Rendern ausgewertet wird. Sauberer ist es, `useRoute()` im Setup aufzurufen.
- **M18. Quelle `google` wird nie gesetzt:** Wer aus der Google-Jobbox kommt, hat kein `?src=`. Die Quelle bleibt `direct`, damit fehlt genau die Auswertung, die verkauft wird. Das ist eine Lücke in Spec und Plan. Vorschlag: `referrer` mit `google.` als Fallback-Quelle `google`.
- **M19. `server/api/__sitemap__/pages.ts:13`:** Ist `EMPLOYER_SLUG` nicht gesetzt, fällt der Filter `slug _eq undefined` bei der Serialisierung weg, und die Sitemap listet die Stellen aller Dienste. Ein Guard `if (!employerSlug)` ohne Stellen wäre besser.
- **M20. `app/composables/useEmployer.ts:12-15`:** `color_primary`/`color_secondary` gehen ungeprüft in das `style`-Attribut von `<html>`. Der Inhalt kommt von Redakteuren, das Risiko ist also gering. Eine Prüfung per Hex-Regex verhindert aber kaputtes CSS durch Tippfehler.

---

## Triage der zurückgestellten Minor-Findings aus dem Ledger

| Ledger-Eintrag | Vor dem Merge fixen? | Begründung |
|---|---|---|
| Task 1: CLAUDE.md nennt „Blumenhaus“ | Nein (erledigt) | „Blumenhaus“ ist aus CLAUDE.md entfernt. Übrig ist nur „Produkte“ im Block-Katalog (M13), das ist kosmetisch. |
| Task 2: `applications.job`/`employer` nur UI-required, nicht `is_nullable:false` | Nein | Directus erzwingt `meta.required` bei Creates von Nicht-Admins, und `/api/apply` setzt beide Felder immer. Wichtiger ist I3 (CASCADE) bzw. I4 (Direkt-Create). Wer dort ohnehin an die Relationen geht, kann `is_nullable` gleich mitziehen. |
| Task 3-6: `.ts`-Endungen in Imports | Nein (erledigt) | `.nuxt/tsconfig*.json` setzt `allowImportingTsExtensions: true`. `vue-tsc` meldet für alle neuen Dateien 0 Fehler (app und server), und der Build läuft laut Ledger. |
| Task 10: Rate-Limit zählt auch ungültige Anfragen | Nein | Der Client validiert vor dem Absenden mit demselben zod-Schema, ein echter Nutzer erzeugt also kaum 422. Das echte Problem am Rate-Limit ist die XFF-Fälschbarkeit (I4b). |
| Task 9/16: Rich-Results-Test noch nicht ausgeführt | Nein für den Merge, Ja vor dem Livegang | Der Ablauf steht im README. Die Spec sieht ihn ohnehin als manuellen Schritt „vor Livegang“ vor. |

---

## Nicht beurteilt

- Aufgabe 15 (`scripts/google-index.mjs`): bewusst per Ruling verschoben, nur der fehlende Stub ist als M13 vermerkt.
- Vom Base-Repo unverändert kopierte Dateien (Blöcke, UI-Komponenten, Registry, Redirects, `copy-directus.mjs`, `scripts/lib/*`): laut Auftrag nicht Gegenstand des Reviews.
- Ob unhead `</script>` im JSON-LD-`innerHTML` escaped: liegt in `app/app.vue` aus dem Base-Repo. Die Eingaben kommen nur von Redakteuren.
- Ob `ensureRelation` das `on_delete` bestehender Relationen nachzieht: Base-Helfer, nicht geprüft. Als Prüfauftrag bei I3 notiert.
- Visuelle Gestaltung und Kontrastwerte (`docs/design-konzept.md`, Tokens): kein Browser gestartet, also keine Messung. Die Kontrastberechnung verlangt das Designkonzept selbst.
- Echter SMTP-Versand und Zustellbarkeit: ohne SMTP-Konfiguration nicht prüfbar.
- Ob Google die Stellen tatsächlich aufnimmt: liegt laut Spec außerhalb dessen, was die Software beeinflusst.
- Rate-Limit über mehrere Instanzen bzw. Serverless-Kaltstarts: im Code als „später Redis“ dokumentiert, die Spec verlangt eine einfache In-Memory-Sperre.
- Funktionen aus Teil 2 und 3 (Rolle „Dienst“, `directus_users.employer`, Portal): laut Spec nicht in Teil 1.
- Ob `yarn directus:copy` die neuen Collections korrekt umzieht: nicht ausgeführt, weil das Schreibzugriffe auf eine Zielinstanz bräuchte.

---

## Empfehlungen

1. I1 und I2 zusammen umsetzen: ein gemeinsamer Fehlerpfad „CMS nicht erreichbar → 503 + Telefonnummer“ für Seite und Formular, dazu ein kurzer manueller Test mit gestopptem Directus-Container.
2. I3 jetzt im Schema-Skript korrigieren, bevor echte Bewerbungen existieren. Später ist es eine Datenmigration.
3. Für I4 ein Ruling mit Robby festhalten: Directus-Policy-Validierung plus sichere IP-Ermittlung jetzt, Wechsel auf ein Token nur zum Anlegen spätestens in Teil 2.
4. M1 (Demo `noindex`) und M5 (Zeitzone in der Mail) sind Einzeiler und lohnen sich gleich mit.
5. Vor dem ersten Kunden: Rich-Results-Test mit echter URL, Bewerbung vom Handy, Aushang drucken (Spec, Abschnitt „Tests“).

---

## Bewertung

**Merge-bereit?** Mit Fixes

**Begründung:** Die Kernanforderungen sind erfüllt und gut getestet: Sichtbarkeit, JobPosting, Public-Rechte, Demo-Kennzeichnung, Mail-Fallback und `noindex`. Vor dem Merge sollten aber der Fehlerpfad bei einem CMS-Ausfall (I1/I2: Bewerber bekommen „Stelle weg“ bzw. „Seite nicht gefunden“) und das kaskadierende Löschen von Bewerbungen (I3) korrigiert werden. Für I4 braucht es mindestens ein dokumentiertes Ruling.
