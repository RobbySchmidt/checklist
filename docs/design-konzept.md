# Designkonzept Stellenseite

- **Zielgruppe:** Pflegekräfte am Handy, in der Pause. Mobile-first, große Tippflächen (min. 48 px), Gehalt und Dienstplan typografisch hervorgehoben.
- **Tokens:** `--primary` aus `employer.color_primary` (Fallback `oklch(0.45 0.08 165)`), `--secondary` aus `color_secondary` (Fallback `oklch(0.95 0.02 165)`), Neutrale leicht grünstichig. Kontraste: Primärfarbe als Fläche mit weißer Schrift, Text auf Papier aus `--foreground`.
- **Schrift:** Inter aus dem Base-Repo bleibt (bereits geladen). Überschriften 700, Fließtext 400, Chips 600 in 0.85rem.
- **Formular:** ein Feld pro Zeile, Labels über dem Feld, Fehler inline unter dem Feld in `--destructive`.
- **Bewegung:** Kein Hover-Lift, keine Animationen außer Fokus-Ring.

## Portal

**Subjekt:** Werkzeug für Pflegedienstleitungen, die zwischen zwei Touren am Handy oder Tablet nachsehen, wer auf Rückruf wartet. Die eine Aufgabe der Startseite: „Wen muss ich heute anrufen?“ Alles andere ordnet sich dem unter.

**Signatur:** Die Rückruf-Liste auf der Übersicht. Jede wartende Bewerbung ist eine Karte mit Name, Qualifikation, Stelle, einer großen Telefon-Taste und einem Zeitstempel „wartet seit 26 Std.“, der ab 24 Stunden bernsteinfarben wird. Das ist die Mechanik, für die der Dienst zahlt, und sie steht an erster Stelle.

**Farbe** (Tokens in `tailwind.css`, gelten unter der Klasse `.portal` auf dem Layout-Wrapper):

| Token | Wert | Verwendung |
|---|---|---|
| `--portal-ink` | `#13392d` | Seitenleiste, Kopfzeile mobil, Überschriften-Akzent (aus dem pracio-Styleguide) |
| `--portal-mint` | `#4ac297` | nur als Fläche: aktive Navigation, Primär-Button, Fokusring. Nie als Schrift auf Papier (Kontrast ~2:1) |
| `--portal-paper` | `#f6f8f7` | Seitenhintergrund; Karten in Weiß mit Haarlinie |
| `--portal-line` | `#dfe6e2` | Haarlinien, Tabellentrenner |
| `--portal-ink-soft` | `#5a6b64` | Sekundärtext |

Status-Chips, jeweils Schrift auf Fläche: neu `#b45309` auf `#fef3c7`, kontaktiert `#1d4ed8` auf `#dbeafe`, gespraech `#6d28d9` auf `#ede9fe`, zusage `#166534` auf `#dcfce7`, absage `#374151` auf `#e5e7eb`. Stellen-Stand nutzt dieselben Paare: published = Grün, draft = Grau, filled = Blau, expired = Grau. Wartezeit ab 24 Stunden: Bernstein wie „neu“.

**Schrift:** Archivo (Google Fonts, 500 und 700) für Überschriften und Kennzahlen, Inter für Fließtext und Formulare, Space Mono 400 für Meta-Labels (Eyebrows, Spaltenköpfe, Zeitstempel, Quelle) in 11px, uppercase, 0.12em Tracking. Zahlen immer `tabular-nums`. Das bindet das Portal an die Rhowerk-Produktfamilie (pracio nutzt Archivo + Space Mono).

**Layout:**
- Desktop (ab `md`): linke Leiste 248px in Tiefgrün. Oben Wortmarke „pflege-jobs“ in Archivo 700, darunter Dienstname (bei Rolle Rhowerk ein Umschalter). Navigation mit Lucide-Icons: LayoutDashboard, Briefcase, Users, Building2. Aktiver Punkt als Mint-Fläche mit Tiefgrün-Schrift, inaktive Punkte in Weiß mit 70 % Deckung. Unten Name des Nutzers und „Abmelden“. Inhalt auf Papier, max. 1100px, Seitenkopf mit Titel (Archivo) links und Hauptaktion rechts.
- Handy (unter `md`): oben eine Kopfzeile in Tiefgrün (Wortmarke, Dienstname), unten eine feste Tab-Leiste mit den vier Bereichen (Icon über Label, 60px hoch, `env(safe-area-inset-bottom)`). Keine Seitenleiste, kein Hamburger. Inhalt bekommt unten 80px Abstand.
- Übersicht: vier Kennzahl-Kacheln (Archivo 700, 2.25rem, Mono-Label darunter), darunter die Rückruf-Liste als Karten. Jede Karte: Name und Qualifikations-Chip, Stelle als Zeile, Zeitstempel als Mono-Label rechts, unten zwei Tasten: „Anrufen“ (Mint, `tel:`) und „Kontaktiert“ (Umriss).
- Stellen: shadcn `Table`, Spaltenköpfe in Mono, Titel fett, Stand als Chip, Zahlen rechtsbündig tabular, Aktionen als vier Icon-Buttons (Pencil, Eye, Share2, Archive bzw. ArchiveRestore) mit `title`. Unter `md` werden Zeilen zu Karten mit denselben Elementen.
- Bewerbungen: Filter als zwei shadcn `Select`. Zeilen als Karten: Name, Qualifikations-Chip, Stelle, Quelle und Eingang als Mono-Label, Telefon als Mint-Taste. Statuswechsel als segmentierte Leiste aus fünf Pillen (aktiv = Statusfarbe), kein nativer Select. Aufklappen zeigt Nachricht, frühester Start, Notiz, Einladung/Absage.
- Formulare (Stelle, Profil): Abschnitte als weiße Karten mit Mono-Eyebrow und Archivo-Titel, einspaltig, Inputs 48px mit Haarlinie und Mint-Fokusring, Checkboxen und Selects aus shadcn. Speichern-Leiste unten sticky (weiß, Haarlinie oben) mit Primär-Button und „Gespeichert“-Rückmeldung. Markup-Karte rechts sticky (ab `lg`) mit Fortschritt „7 von 8 Pflichtfeldern“, Punkte grün/rot, Empfehlungen bernstein.
- Login: zentrierte Karte auf Tiefgrün-Hintergrund, Wortmarke oben, Felder wie im Portal.
- Leerzustände: ein Satz, was fehlt, und eine Aktion („Noch keine Stelle angelegt.“ + Button „Erste Stelle anlegen“). Nie nur „keine Einträge“.

**Bewegung:** keine Animationen außer Farbwechsel bei Hover (nur unter `@media (hover: hover)`) und Fokusring. Kein Hover-Lift.

**Schreibweise:** Sentence case, aktive Verben auf Buttons („Stelle speichern“, danach „Gespeichert“), Fehler sagen, was zu tun ist.
