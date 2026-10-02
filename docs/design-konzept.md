# Designkonzept pflege-jobs

Gilt für Portal **und** öffentliche Seiten (Stellenliste, Stellenseite, Aushang, Google-Vorschau). Grundlage ist `docs/DESIGN-GUIDE.md`; dieses Konzept übersetzt den Guide in konkrete Entscheidungen. Bei Widerspruch gilt der Guide.

## Grundregeln aus dem Guide, hier verbindlich

1. **Weglassen vor Hinzufügen.** Kein Element ohne Aufgabe. Keine Eyebrows, keine Abschnittsnummern, keine Boxen, wo Abstand oder eine Haarlinie reicht.
2. **Hierarchie über Größe und Transparenz**, nicht über neue Farben. Nebeninfo bekommt `opacity-75`, keine eigene Farbe.
3. **Eine Schrift, zwei Stärken, vier Größen.** Archivo (Google Fonts, 400 und 500). Keine zweite Familie, kein Mono.
4. **Ein Radius** für alles: `--radius: 0.75rem`. Buttons vollrund, sonst der eine Radius.
5. **Abstände nie doppelt** (`gap` oder `space-y`, nie beides). Eng innerhalb einer Gruppe, weit zwischen Gruppen.

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

## Portal

**Aufgabe der Startseite:** „Wen muss ich heute anrufen?“ Die Rückruf-Liste ist das Wichtigste und steht nach den vier Kennzahlen.

- **Seitenleiste (Desktop):** 240px, Tiefgrün, Text weiß. Wortmarke „pflege-jobs“ in Display-Größe, darunter Dienstname (`opacity-75`), bei Rhowerk ein Umschalter als Dropdown mit weißer Haarlinie. Navigation: Icon + Label, aktiver Punkt wie bisher. Unten Nutzername (`opacity-75`) und Abmelden.
- **Mobil:** Kopfzeile Tiefgrün mit Wortmarke und Dienstname, unten Tab-Leiste mit vier Bereichen; aktiv = weiß, inaktiv `opacity-75`. Keine Seitenleiste.
- **Seitenkopf:** Titel in Display-Größe links, eine Primär-Aktion rechts (Mint, vollrund, Tiefgrün-Schrift). Sonst nichts.
- **Kennzahlen:** vier Zahlen in Display-Größe mit Label darunter in Klein, getrennt durch Luft, auf Desktop eine Haarlinie zwischen den Spalten. Keine Kacheln.
- **Rückruf-Liste:** Liste mit Haarlinien zwischen Einträgen, keine Karten. Zeile: Name (medium) + Qualifikation (klein, `opacity-75`), darunter Stelle (klein), rechts Wartezeit (klein). Aktionen: „Anrufen“ als Mint-Button, „Kontaktiert“ als Textbutton mit Haarlinie. Mehr Abstand vor den Aktionen als zwischen den Texten.
- **Stellen:** Tabelle ohne Rahmenkasten, nur Haarlinien zwischen Zeilen, Spaltenköpfe klein `opacity-75`. Titel medium, Stand als Chip wie bisher, Zahlen rechts. Aktionen als vier Icon-Buttons in `--ink`, Hover `opacity-75`. Mobil: dieselben Zeilen gestapelt.
- **Bewerbungen:** Filter als zwei Selects. Einträge als Liste mit Haarlinien. Statuswechsel als fünf Textpillen mit Haarlinie, aktiv wie bisher in der Statusfarbe. Telefon als Mint-Button, „Details“ als Textbutton.
- **Formulare:** Abschnitte durch eine Überschrift und Luft getrennt, keine Karten, keine Abschnittsnummern. Felder 48px, Haarlinie, Fokusring Tiefgrün 2px. Labels Klein, medium. Speichern-Leiste unten sticky, Papier mit Haarlinie oben, Mint-Button links, „Gespeichert“ daneben in Klein. Markup-Prüfung rechts ab `lg` als schlichte Liste mit Punkten, Überschrift „Google-Markup: 6 von 8 Pflichtfeldern“, kein Kasten.
- **Login:** Tiefgrün-Hintergrund, weiße Fläche mittig (hier hat die Fläche eine Aufgabe), Wortmarke, zwei Felder, ein Mint-Button.
- **Leerzustände:** ein Satz in Text-Größe und, wenn sinnvoll, die Aktion.

## Öffentliche Seiten (Bewerberinnen, Pflegedienst im Gespräch)

**Aufgabe:** In zehn Sekunden erkennen: Stelle, Gehalt, Dienstplan, und wo ich mich bewerbe. Vertrauen vor Kreativität.

- **Rhythmus:** Kopf (Papier) → Gehalt-Band (Tiefgrün, weiße Schrift) → Inhalt (Papier) → Bewerbung (Papier, Formular auf weißer Fläche) → Teilen (Papier, Haarlinie oben). Hell und dunkel im Wechsel, Tiefgrün nur einmal.
- **Stellenseite:** Dienstname klein `opacity-75`, Stellentitel Display mit `(m/w/d)` in Klein `opacity-75` daneben. Chips (Beschäftigungsart, Stunden, Start) als Text mit `·` getrennt, keine Pillen. Gehalt-Band: Zahl Display, Hinweis Klein. Aufgaben und Voraussetzungen als Listen mit Luft, keine Boxen. „So arbeiten wir“: Dienstplan als Satz, Benefits als zweispaltige Liste mit Haarlinien. Formular auf weißer Fläche, ein Mint-Button „Rückruf anfordern“ (Dienstfarbe beim Kunden). Sticky-Button mobil in Dienstfarbe. Teilen: drei Textbuttons mit Haarlinie, QR daneben.
- **Stellenliste:** Dienstname, Einsatzgebiet klein, Liste der Stellen mit Haarlinien: Titel medium, Beschäftigungsart · Stunden klein, Gehalt rechts medium. Keine Karten.
- **Aushang:** Titel Display, ein Satz, großer QR, URL. Nichts weiter.
- **Google-Vorschau:** Banner oben in Bernstein-Fläche mit Tiefgrün-Text, ein Satz. Darunter die Nachbildung: Suchfeld als Haarlinien-Kasten, Jobbox als weiße Fläche mit Haarlinien zwischen den drei Einträgen, eigener Eintrag mit Titel medium, Vergleichseinträge `opacity-75`. Hinweistext aus der Spec als Absatz mit Haarlinie links, kein farbiger Kasten.

## Bewegung

Keine Animationen. Hover nur als Farbwechsel oder `opacity-75`, nur unter `@media (hover: hover)`. Fokusring sichtbar.

## Kurz-Checkliste vor jedem Commit

- Höchstens vier Schriftgrößen, zwei Stärken, eine Familie?
- Keine Box, die nur Rahmen ist?
- Keine doppelten Abstände?
- Gleiche Aktion, gleiches Aussehen auf allen Seiten?
