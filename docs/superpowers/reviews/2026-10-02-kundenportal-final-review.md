# Final-Review Teil 2 „Kundenportal“ (e8e0a42..981c373)

Reviewer: Opus, read-only. Grundlage: Spec `docs/superpowers/specs/2026-10-02-kundenportal-design.md`, Plan (Global Constraints, Review Focus), Ledger, kompletter Diff. Geprüft zusätzlich: `yarn test` (45/45 grün), lokale Directus-Instanz read-only (Public-Rechte, effektive App-Rechte über `/permissions/me`, Asset-Header), `jobSchema` gegen die vorhandenen Stellen (Schließen-Knopf funktioniert für beide Seed-Stellen).

## Stärken

- **Die Tenant-Isolation ist durchgängig sauber.** Alle `/api/portal/*`-Routen holen den Dienst aus `requirePortalUser`. Jede Abfrage und jedes PATCH filtert zusätzlich nach `employer: { _eq: employer.id }`. Beim Anlegen einer Stelle setzt der Server `employer`, und weil zod unbekannte Schlüssel entfernt, lassen sich `employer`, `slug` (Dienst), `domains`, `status` und `is_demo` nicht über den Body einschleusen. `?employer=` wird nur bei der Rolle `rhowerk` ausgewertet.
- **Die App-Rolle ist eng geschnitten (live geprüft).** `employers.update` erlaubt nur die Profilfelder, `slug` und `domains` sind nicht schreibbar. `applications.update` erlaubt nur `status`, `note`, `first_contact_at` und `reminder_sent_at`. Delete gibt es nur auf `login_tokens`.
- **Public-Create ist wirklich entfernt (live geprüft).** Public bekommt 403 auf `applications` (lesen und anlegen), `portal_users`, `login_tokens` und `job_views`.
- **Der Magic-Link ist solide gebaut.** Token mit 32 Bytes, gespeichert wird nur der SHA-256-Hash, Ablauf nach 15 Minuten, `used_at` wird geprüft, ein Formatcheck läuft vor dem Lookup. `request-link` antwortet immer `{ ok: true }`. Eingelöst wird per POST aus dem Browser, Mail-Scanner, die den Link vorab öffnen, verbrauchen ihn also nicht. Das Session-Cookie ist versiegelt.
- **Die Hintergrund-Jobs sind sauber getrennt.** Die reine Logik (`selectReminderCandidates`, `aggregateReport`, `previousMonthRange`) ist getrennt von I/O und getestet. Review Focus 4 (genau 24 h / 23:59) und 5 (Median ohne Daten → `null`) sind abgedeckt. Fehler bei einem Dienst brechen den Lauf nicht ab. `force` geht nur über den Endpoint mit Secret.
- **Mails werden escaped.** Alle Nutzerdaten in Reminder-, Report- und Login-Mail-HTML laufen durch `esc`. Im Portal gibt es kein `v-html`. `linesToList` escaped, und die öffentliche Stellenseite sanitisiert zusätzlich mit DOMPurify.
- **Fehlerkarten statt leerer Tabellen** auf Übersicht, Stellen, Bewerbungen und Profil.
- **Das Tracking ist datensparsam:** keine IP, kein Cookie, Bots ausgefiltert, Fehler werden geschluckt.
- **Umzug und Deploy sind dokumentiert:** README zu Domains, Portal, Endpoint-Fallback mit `curl`-Beispielen und Variablen. Das Schema-Skript erzeugt den App-Token idempotent.

## Befunde

### Critical (Must Fix)

Keine.

### Important (Should Fix)

**I1 – Öffentliche Links zeigen bei mehreren Diensten auf die falsche Domain (`SITE_URL` statt Host-Dienst).**
`server/api/qr/[slug].get.ts:10`, `app/pages/jobs/[slug]/aushang.vue:24`, `app/components/jobs/ShareBox.vue:21`, `app/pages/jobs/[slug]/index.vue:50` und `:75`, `server/api/apply.post.ts:62`.
- **Was:** QR-Code, Aushang, Teilen-Box der Stellenseite, `JobPosting.url` (JSON-LD), `og:url` und der Stellenlink in der Bewerbungsmail bauen die URL aus `runtimeConfig.public.siteUrl`. Bei „einer Instanz für alle Kunden“ gibt es aber nur ein `SITE_URL`.
- **Warum:** Der Aushang-QR von Dienst B führt auf die Domain aus `SITE_URL`. Dort löst die Middleware Dienst A oder den Fallback auf, und es erscheint 404 oder, weil Slugs nur pro Dienst eindeutig sind, die Stelle eines anderen Dienstes. Google bekommt für B eine JobPosting-URL auf fremder Domain. Gedruckte Aushänge lassen sich nicht zurückholen. Die Spec nennt `/api/qr` ausdrücklich unter „Betroffen“. Nur das Portal (`ShareDialog`) nutzt bereits `employer.domains[0]`, im Portal-Dialog stimmen Link und WhatsApp also. Das QR-Bild dort kommt aber ebenfalls von `/api/qr` und zeigt damit auf `SITE_URL`.
- **Wie beheben:** Einen Helfer `employerBaseUrl(employer, fallback)` anlegen: `https://${domains[0]}`, sonst `siteUrl`. Server-Routen nutzen ihn mit `event.context.employer`, Seiten mit `useEmployer()`. `/api/qr` braucht den Host-Dienst und gibt ohne Dienst 404.

**I2 – Magic-Link-Domain kommt aus dem Host-Header (Link-Poisoning).**
`server/api/auth/request-link.post.ts:23`
- **Was:** Ohne `PORTAL_BASE_URL` wird der Link aus `getRequestProtocol`/`getRequestHost` gebaut, also aus dem frei setzbaren `Host`-Header.
- **Warum:** Hängt die Instanz als Catch-all hinter dem Proxy (naheliegend bei „eine Instanz, viele Domains“), kann ein Angreifer für eine bekannte Dienst-Adresse einen Link mit `Host: angreifer.example` anfordern. Das Opfer bekommt eine echte Mail vom System, und ein Klick schickt den gültigen Token an den Angreifer. Das ist die klassische Reset-Link-Poisoning-Lücke. Nebenbei: Fordert ein `dienst`-Nutzer den Link auf einer fremden Dienst-Domain an, landet er nach dem Login im 403 der Host-Bindung. Das README (`README.md:48`) beschreibt „leer = erste Domain des Dienstes“, der Code macht etwas anderes.
- **Wie beheben:** Basis-URL in dieser Reihenfolge wählen: `PORTAL_BASE_URL`, sonst bei `dienst` die erste Domain des Dienstes des Nutzers (`user.employer.domains[0]` mitladen), sonst bei `rhowerk` die Domain von `event.context.employer`, sofern sie per Domain aufgelöst wurde, sonst `SITE_URL`. Den rohen Request-Host nie verwenden.

**I3 – Deaktivierte Nutzer behalten 30 Tage Zugriff.**
`server/utils/session.ts:8-17`
- **Was:** `requirePortalUser` vertraut der Rolle und `employerId` aus dem Cookie. `portal_users.status`, `role` und `employer` werden nach dem Login nicht mehr geprüft.
- **Warum:** Wer eine PDL auf `disabled` setzt (zum Beispiel weil sie ausgeschieden ist) oder ihr den Dienst entzieht, erwartet, dass der Zugang sofort endet. Tatsächlich sieht die Person bis zu 30 Tage weiter Bewerberdaten mit Name, Telefon und Notizen. Das ist DSGVO-relevant. Die Spec legt den Session-Inhalt fest, aber nicht, dass er ungeprüft bleibt.
- **Wie beheben:** In `requirePortalUser` den Nutzer per App-Token nachladen (`id,status,role,employer`, 60 s In-Memory-Cache genügt). Bei `status !== 'active'` die Session leeren und 401 werfen. `role` und `employer` aus der Datenbank nehmen, nicht aus dem Cookie.

**I4 – Interne Dienst-Felder sind öffentlich lesbar.**
`scripts/setup-schema-jobs.mjs:153` (Public-Read `employers` mit `fields: *`) und `server/api/employer.get.ts:6` (gibt den ganzen Datensatz zurück).
- **Was:** Live geprüft: Ohne Token liefert `GET /items/employers?fields=report_email,template_invite,notify_reminders,domains` die Werte. `/api/employer` reicht ebenfalls alle Felder durch.
- **Warum:** Die Spec sagt „öffentlich, nur veröffentlichte Felder“. `report_email` ist oft eine persönliche Adresse der PDL. Vorlagen und Benachrichtigungsschalter sind interne Einstellungen.
- **Wie beheben:** Public-Read `employers` auf eine Feldliste beschränken (die Felder aus Teil 1 plus `domains`, aber ohne `report_email`, `template_*` und `notify_reminders`), und zwar im Portal-Schema-Skript per `ensurePermission` auf der Public-Policy. `/api/employer` gibt nur dieselbe Whitelist zurück. Die Middleware lädt weiterhin public.

### Minor (Nice to Have)

1. **`server/utils/session.ts:20`: Die Host-Bindung greift nicht, wenn `event.context.employer` null ist.** Das passiert bei unbekanntem Host ohne Fallback oder bei Directus-Ausfall. Ein `dienst`-Nutzer kann das Portal dann auf jedem nicht zugeordneten Host nutzen. Die Daten bleiben gefiltert, nur die Spec-Regel ist verletzt. Fix: Bei `dienst` 403, wenn `!hostEmployer && !isLocal`.
2. **`server/api/apply.post.ts:46`: Die Prüfung „Stelle gehört zum Host-Dienst“ entfällt, wenn der Host-Dienst null ist.** Fix: Ohne Host-Dienst 404.
3. **`server/api/track.post.ts:12`: Fremde Job-IDs werden dem Host-Dienst gezählt.** Es wird nicht geprüft, ob `job` zum Host-Dienst gehört, und es gibt kein Rate-Limit. Zahlen in Übersicht und Report lassen sich per `curl` aufblähen. Read-then-increment ist nicht atomar, bei gleichzeitigen Aufrufen gehen Zählungen verloren. Fix: Job-Zugehörigkeit prüfen (gecachte ID-Liste je Dienst), IP-Rate-Limit wie bei `apply`.
4. **`server/api/auth/consume.post.ts:13`: Prüfen und Setzen von `used_at` ist nicht atomar.** Zwei gleichzeitige Requests mit demselben Token erzeugen zwei Sessions. Fix: Bedingtes Update (`PATCH /items/login_tokens` mit `filter: { id, used_at: { _null: true } }` und Trefferzahl prüfen).
5. **`server/api/tasks/[name].post.ts:6`: Der Secret-Vergleich mit `!==` ist nicht zeitkonstant.** Fix: `timingSafeEqual` auf SHA-256 beider Werte.
6. **`request-link`: Antwortzeit unterscheidet sich.** Bei bekannten Adressen läuft ein Directus-POST und der SMTP-Versand, die Adresse ist also über die Zeit erratbar. Das Rate-Limit pro E-Mail bremst das kaum, weil der Angreifer pro Adresse nur einen Versuch braucht. Ein IP-Limit fehlt. Fix: zusätzliches IP-Rate-Limit. Die Zeitdifferenz ist ein bewusster Trade-off mit dem spec-geforderten 503.
7. **`login_tokens` werden nie gelöscht.** Fix: abgelaufene Tokens im `reminders`-Lauf löschen (die Delete-Permission existiert schon).
8. **`server/api/portal/upload.post.ts:9,12`: Upload-Prüfung lückenhaft.** Der Body wird ohne Größenlimit komplett gelesen, bevor 2 MB geprüft werden, und der Typ kommt aus dem Client-Header (keine Magic Bytes). SVG ist erlaubt. Directus liefert Assets mit `Content-Security-Policy: default-src 'none'` (live geprüft), das SVG-Script-Risiko ist also entschärft. Fix: `content-length` vorab prüfen, Magic Bytes prüfen.
9. **`server/api/portal/upload.post.ts`: Token-Header und Fehlerbehandlung von `appFetch` sind dupliziert (DRY).** Fix: `appFetch` um Multipart-Body erweitern.
10. **`server/middleware/employer.ts:26`: Kein Stale-Cache bei Directus-Ausfall.** Nach Ablauf des Caches führt ein Ausfall sofort zu 503 auf allen Seiten. Fix: Bei Fehler den alten Cache weiterverwenden und nur loggen. Nach einer Domain-Änderung dauert es bis zu 5 Minuten, bis sie greift. Das ist laut Spec so gewollt.
11. **`app/composables/useEmployer.ts:20`: Unbekannter Host liefert Redirect und 200 statt HTTP 404.** Die Spec verlangt 404. Fix: `/kein-dienst` setzt `setResponseStatus(404)` (oder direkt rendern statt umleiten).
12. **`app/pages/portal/stellen/index.vue:23`: Abgelaufene Stellen erscheinen als „Veröffentlicht“.** Eine Stelle mit `published` und abgelaufenem `valid_through` steht so in der Liste, ist aber auf der Website unsichtbar. Der Dienst erwartet „Abgelaufen“. „Öffnen“ auf eine abgelaufene Stelle bewirkt still nichts Sichtbares. Fix: Anzeige-Status aus `isJobVisible` ableiten. Beim Öffnen auf `valid_through` hinweisen oder es um 60 Tage verlängern.
13. **`shared/utils/overview.ts:12`: Die Kachel „ohne Rückruf“ zählt alle offenen Bewerbungen aller Zeiten.** Die Spec meint Bewerbungen des Monats. Außerdem lädt die Übersicht alle Bewerbungen des Dienstes, um den Monat zu zählen. Fix: Filter auf den Monat oder die Kachel umbenennen, `date_created` serverseitig filtern.
14. **`server/tasks/report.ts:14` und `shared/utils/report.ts:29`: Report-Abgrenzung ungenau.** „Mindestens eine Stelle im Vormonat“ ist als „irgendeine Stelle mit `date_posted <= monthEnd`“ umgesetzt. Ein Dienst, dessen letzte Stelle vor zwei Jahren endete, bekommt also jeden Monat einen Report. `jobsExpired` zählt alle Stellen mit Status `expired`, auch aus früheren Monaten. Fix: `valid_through >= monthStart` als Bedingung. `expired` nur werten, wenn `valid_through` im Monat liegt.
15. **`server/tasks/reminders.ts:15`: Erinnerungen gehen immer an `employer.apply_email`.** `jobs.apply_email_override` wird ignoriert, anders als bei der Bewerbungsmail. Beim ersten Lauf nach dem Deploy bekommt jeder Dienst eine Sammelmail mit allen historischen „neu“-Bewerbungen. Fix: vor dem Go-live alte Bewerbungen mit `reminder_sent_at` markieren oder nur Bewerbungen der letzten 7 Tage berücksichtigen.
16. **Reminders bei Scheduler plus externem Cron:** Laufen beide parallel, sind doppelte Mails möglich. Die README sollte „entweder/oder“ sagen.
17. **`app/pages/portal/stellen/[id].vue:8` und `neu.vue`:** `[id]` zeigt bei jedem Fehler (auch 503) „nicht gefunden“, `neu` bei `/me`-Fehler eine leere Seite. Ein 401 (Session serverseitig ungültig) erscheint auf allen Portal-Seiten als „Gerade nicht erreichbar“ statt als Redirect mit Hinweis (Spec „Session abgelaufen“). Fix: Bei 401 auf `/portal/login?expired=1` umleiten (globaler `onResponseError` im Layout), auf der Login-Seite den Hinweis anzeigen.
18. **Rhowerk ohne Host-Dienst bleibt hängen.** Ohne `?employer=` liefert auch `/api/portal/me` 403, der Dienst-Umschalter erscheint also nie. Fix: `/me` liefert für `rhowerk` die Dienstliste auch ohne aktuellen Dienst.
19. **`app/pages/portal/bewerbungen.vue`: Spalten weichen von der Spec ab.** „Quelle“ fehlt, statt „vor X Stunden“ steht nur das Datum.
20. **`app/components/portal/JobForm.vue`: `listToLines` entfernt Formatierung.** Fett, Links und verschachtelte Listen aus in Directus gepflegten Aufgaben gehen beim ersten Speichern im Portal verloren. Die Spec sagt nur „einfacher Rich-Text mit Listen“, der Effekt ist also hinnehmbar, sollte aber im Formular stehen.
21. **`shared/utils/auth.ts` importiert `node:crypto` in `shared/`.** Das ist auto-importiert für den Client, und ein versehentlicher Client-Import bricht den Build. Fix: nach `server/utils/` verschieben.
22. **Session-Typ:** `auth.d.ts` fehlt (Ledger T6). `session.user` wird überall gecastet. Fix: `declare module '#auth-utils' { interface User { … } }`.
23. **`CLAUDE.md:7`: Veraltete Regel.** Dort steht noch „`applications` ist für Public nur anlegbar“, und die Schema-Regel ist doppelt. **`README.md:48`** (siehe I2): Die Beschreibung passt nicht zum Code.
24. **`appFetch` reicht Directus-Fehlermeldungen bei 4xx an den Browser durch** (z. B. „You don't have permission to access field …“). Fix: generische deutsche Meldung, Original nur loggen.

### Test-Lücken (Einordnung)

- **Review Focus 3** verlangte einen Test der Filterfunktion für fremde Bewerbungen (Task 9). Es gibt keinen, der Filter steht inline in der Route. Per Codelesen ist er korrekt (`id` und `employer` im selben Filter, sonst 404). Das Risiko liegt in künftigen Änderungen. Empfehlung: Filterbau in `shared/utils/portalFilters.ts` auslagern und testen.
- **Mail-Templates** (`renderLoginMail`, `renderReminderMail`, `renderReportMail`) sind ungetestet. Escaping, Pluralformen, der Median `null` → Text und das deutsche Komma sind nur manuell geprüft. Das Risiko ist gering (reine Funktionen, leicht testbar), ein Snapshot-/Escaping-Test pro Template wäre billig.
- **Routen** (Tenant-Filter, Host-Bindung, `consume`, `request-link`, `tasks`-Secret) sind nur manuell per `curl` geprüft. Für die Security-relevanten Pfade (I2, I3, Host-Bindung) lohnt ein kleiner Integrationstest gegen eine Test-Directus oder mit gemocktem `appFetch`.
- Die vorhandenen 45 Tests prüfen echtes Verhalten (Randfälle 24 h, Median, Monatsgrenze Jahreswechsel, Port und Großschreibung beim Host) und sind keine Attrappen.

## Triage der zurückgestellten Minor-Findings aus dem Ledger

| Ledger-Eintrag | Entscheidung |
|---|---|
| T7: `/api/portal/me` liefert den vollen employer-Datensatz | **Belassen.** Es ist der eigene Dienst, und dieselben Felder liefert `/api/portal/employer` ohnehin. Nach dem Fix von I4 ist das öffentliche Gegenstück eingeschränkt. |
| T4: Fremd-Dienst-404 bei `/api/apply` nicht live geprüft | **Per Codelesen bestätigt** (`apply.post.ts:46`). Die Lücke bei Host-Dienst null steht als Minor 2. |
| T6: `auth.d.ts` nicht angelegt, `vue-tsc` nicht gelaufen | **Minor 22.** Kein Laufzeitfehler, aber Typsicherheit fehlt. |
| T10: UI nur per HTTP 200 geprüft | **Offen, manueller Schritt.** Robby prüft Profil, Upload und Bewerbungen im Browser (Tablet-Viewport). |
| T3: Middleware überspringt nur `/api/_nuxt_icon` | **Belassen.** Sie läuft auf allen anderen Pfaden. Durch den Cache sind die Kosten gering. |

## Nicht beurteilt

- **Netlify vs. Mittwald und ob Nitro-Scheduler nativ laufen:** Die Spec führt das als offene Entscheidung. Der Endpoint-Fallback ist dokumentiert.
- **SSR-Weitergabe des Host-Headers bei internen `useFetch`-Aufrufen im Portal:** Ohne Dev-Server nicht prüfbar. Die Datenisolation hängt nicht davon ab, weil der Dienst aus der Session kommt.
- **Visuelles Design und Tablet-Tauglichkeit:** Laut Auftrag gibt es keinen Dev-Server, der Browsercheck liegt bei Robby.
- **SMTP-Zustellbarkeit (SPF/DKIM) von Login-Mails:** Hängt vom Hosting ab, ist nicht Teil der Spec.
- **Skalierung:** `limit: -1` bei Bewerbungen und Aufrufen für den Report und `limit: 500` in der Liste passen für die erwartete Größe kleiner Pflegedienste. Keine Spec-Vorgabe.
- **Mehrere Nutzer pro Dienst verwalten und einladen:** Laut Spec nicht in Teil 2.
- **Löschen von Bewerbungen und Aufbewahrungsfristen (DSGVO-Löschkonzept):** Weder Spec noch Plan sehen das vor. Es sollte aber vor dem echten Kundenbetrieb geklärt werden.
- **Cookie-Domain und Login pro Domain bei Rhowerk:** Ergibt sich aus dem Design (Session pro Host), die Spec verlangt nichts anderes.
- **Die 20 Minor-Punkte aus dem Teil-1-Review:** Laut Auftrag nicht erneut bewertet.

## Empfehlungen

1. I1 bis I4 vor dem ersten echten Zweitkunden beheben. I1 und I4 sind klein, I2 und I3 je etwa 20 Zeilen.
2. Danach einen Integrationstest für `requirePortalUser` mit gemocktem `appFetch` schreiben: Host-Bindung, deaktivierter Nutzer, `?employer=` bei `dienst` wird ignoriert.
3. Vor dem Go-live: alte „neu“-Bewerbungen markieren (Minor 15) und die README um „Scheduler oder externer Cron, nicht beides“ ergänzen.
4. Den Manuellen-Test-Ablauf aus der Spec einmal komplett im Browser durchgehen (Login-Rundlauf, Stelle anlegen und auf der Stellenseite sehen, „Kontaktiert“, Tasks per Endpoint), dazu einen QR-Code auf zwei Domains testen (prüft I1).

## Bewertung

**Merge-bereit?** Mit Fixes

**Begründung:** Tenant-Isolation, Rechte und Magic-Link-Grundmechanik sind korrekt, und es gibt keinen kritischen Befund. Die vier Important-Punkte (falsche Domain in QR/JSON-LD bei mehreren Diensten, Host-Header im Login-Link, keine Sperrung deaktivierter Nutzer, öffentlich lesbare interne Felder) treffen aber genau den Mehrkundenbetrieb, für den Teil 2 gebaut ist, und sollten vor dem Merge behoben werden.
