# Designkonzept pflege-jobs

Gilt für Portal **und** öffentliche Seiten (Stellenliste, Stellenseite, Aushang, Google-Vorschau). Grundlage ist `docs/DESIGN-GUIDE.md`; dieses Konzept übersetzt den Guide in konkrete Entscheidungen. Bei Widerspruch gilt der Guide.

## Geltungsbereich

**Struktur bleibt.** Seitenleiste, Karten, Kacheln, Chips, Eyebrows und der Aufbau aller Seiten bleiben so, wie sie im Portal-Redesign vom 2. Oktober 2026 (Commit 59a0900) angelegt sind. Dieser Guide-Durchgang betrifft ausschließlich **Schriftgrößen, Schriftstärken, Abstände und Hierarchie** (Guide-Abschnitte 02, 03, 04). „Weniger ist mehr“ (01) wird nicht als Abbau von Elementen umgesetzt.

1. **Hierarchie über Größe und Transparenz**, nicht über neue Farben. Nebeninfo bekommt `opacity-75`.
2. **Zwei Stärken, vier Größen.** Archivo für Überschriften und Kennzahlen, Inter für Fließtext, Space Mono für Eyebrows bleiben wie im Redesign; Stärken nur 400 und 500 (Archivo 700 nur in der Wortmarke).
3. **Ein Radius** für alles: `--radius: 0.75rem`. Buttons vollrund.
4. **Abstände nie doppelt** (`gap` oder `space-y`, nie beides). Eng innerhalb einer Gruppe, weit zwischen Gruppen. Boxen nicht größer als ihr Inhalt.

## Schriftskala (Tailwind-Klassen, fluid wo vorhanden)

| Stufe | Klasse | Verwendung |
|---|---|---|
| Display | `text-3xl md:text-4xl font-medium leading-tight` | Seitentitel (eine pro Seite), Stellentitel, Kennzahl |
| Überschrift | `text-xl font-medium leading-tight` | Abschnitte, Kartenname |
| Text | `text-base` (16px) | Fließtext, Formulare, Tabellenzellen |
| Klein | `text-sm` | Nebeninfo, Labels, Chips, Zeitstempel, immer mit `opacity-75`, wenn Nebeninfo |

Mehr Größen gibt es nicht. `font-medium` nur für Überschriften, Buttons und Namen; alles andere `font-normal`. Zahlen in `tabular-nums`.

## Farben

Farben werden in diesem Durchgang **nicht** angefasst. Die bestehenden Tokens (Tiefgrün, Mint, Papier, Status-Paare, Dienstfarbe auf den öffentlichen Seiten) bleiben, wie sie sind. Ein eigener Farb-Durchgang folgt gesondert.

## Portal und öffentliche Seiten

Aufbau wie im Redesign (siehe Commit 59a0900 und die Screenshots dazu). Anzuwenden sind nur die Schriftskala, die Stärken, die Abstandsregeln und die Hierarchie-Regeln oben. Konkrete Punkte: Seitentitel Display, Abschnittstitel Überschrift, Nebeninfos Klein mit `opacity-75`, `(m/w/d)` klein neben dem Stellentitel, Aktionen mit mehr Abstand als Texte, in der Seitenleiste Luft zwischen Wortmarke, Dienst-Umschalter und Navigation.

## Bewegung

Keine Animationen. Hover nur als Farbwechsel oder `opacity-75`, nur unter `@media (hover: hover)`. Fokusring sichtbar.

## Kurz-Checkliste vor jedem Commit

- Höchstens vier Schriftgrößen, zwei Stärken, eine Familie?
- Keine Box, die nur Rahmen ist?
- Keine doppelten Abstände?
- Gleiche Aktion, gleiches Aussehen auf allen Seiten?
