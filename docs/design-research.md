# Design-Research – Regeln, Methode, Systemwissen

Projektneutrale Arbeitsgrundlage für alle Websites, die aus diesem Starter (Nuxt 4 + Tailwind v4 + shadcn-vue + Directus Page Builder) entstehen.

## 0. Gebrauchsanweisung

**Wofür:** Diese Datei enthält (1) verdichtetes, quellenbelegtes Design-Wissen als prüfbare Regeln, (2) eine Methode, um daraus ein Designkonzept für *ein konkretes Projekt* abzuleiten, (3) Systemwissen über dieses Repo, (4) eine leere Konzept-Vorlage und (5) eine Abnahme-Checkliste.

**So arbeitest du damit:**
1. Kapitel 1 (Regeln) und Kapitel 3 (Systemwissen) lesen.
2. Marke, Bildwelt, Ziel der Seite klären. Mit Kapitel 2 (Methode) die Entscheidungen erarbeiten und in die Vorlage aus Kapitel 4 schreiben (eigene Datei im Projekt, z. B. `docs/design-konzept.md`). Erst danach Code anfassen.
3. Umsetzen. Am Ende gegen Kapitel 5 (Checkliste) prüfen – mit Screenshots und nachgerechneten Kontrasten, nicht nach Gefühl.

**Was der Starter vorgibt – und was nicht:** Der graue shadcn-Default-Look ist nur der Auslieferungszustand des Starters, **kein Designziel**. Jedes Projekt bekommt eine eigenständige Gestaltung auf Basis dieser Datei; die fertige Seite soll nicht als „shadcn-Seite" erkennbar sein.

shadcn-vue/reka-ui ist das **technische Fundament**, kein ästhetischer Rahmen:
- Erster Hebel sind die Design-Tokens in `app/assets/css/tailwind.css` (Farben als OKLCH, `--radius`, Fonts, Schatten) sowie die fluide Typo-Skala `--text-f-*` und Abstandsskala `--spacing-f-*` – was sich dort lösen lässt, dort lösen.
- Zweiter Hebel ist die Komposition: Blöcke (`app/components/blocks/*.vue`), `BlockSection.vue`, `BlockIntro.vue`, Header und Footer dürfen strukturell umgebaut werden (Layout, Raster, eigene Sektionsköpfe, dekorative Elemente aus der Bildwelt).
- Dritter Hebel sind die Komponenten selbst: Die Dateien unter `app/components/ui/` sind ins Repo kopierter Code und dürfen angepasst werden (Varianten per `cva` in `*/index.ts`, Klassen, Struktur), wenn das Konzept es verlangt. Bedingungen: Accessibility von reka-ui (Fokus, Tastatur, ARIA) bleibt intakt; Änderungen bewusst und im Projektkonzept dokumentiert – ein späteres `shadcn-vue add --overwrite` würde sie überschreiben.

**Nicht:** fremde UI-Libraries daneben stellen, Komponenten ohne Not neu erfinden (erst anpassen, dann ersetzen), Effekte ohne Begründung aus Marke und Konzept (siehe Anti-Patterns 1.8 – beliebige Verläufe, Glas, Glow sind kein eigener Stil, sondern ein anderer Default).

**Kennzeichnung:** Aussagen ohne Quellenkürzel sind Handwerksregeln bzw. Schlussfolgerungen des Autors. „(ungeprüft)" heißt: plausibel, aber weder an einer Quelle noch am Code verifiziert.

---

## 1. Die Regeln

Jede Regel ist so formuliert, dass man sie am fertigen Screen mit Ja/Nein prüfen kann. Quellenkürzel → Kapitel 6.

### 1.1 Grundprinzipien

1. **Hierarchie ist das Hauptproblem, nicht Dekoration.** Pro Viewport genau *ein* dominantes Element, danach eine klare zweite und dritte Ebene. Test: Screenshot auf 25 % verkleinern oder weichzeichnen – die Lesereihenfolge muss erkennbar bleiben. [RUI] [NNG-VD]
2. **Drei Hebel: Größe, Gewicht, Farbe** – nicht nur Größe. Sekundäres wird *zurückgenommen* (kleiner, leiser), statt Primäres immer weiter aufzublasen. [RUI]
3. **Maximal ~3 Textfarben** (Haupt-, Sekundär-, Tertiärtext) und **2 Gewichte** je Schrift (normal 400–500, betont 600–700). Keine Gewichte < 400 für UI-Text; zum Zurücknehmen Farbe/Größe nutzen, nicht dünnere Schnitte. [RUI]
4. **Skalen statt Einzelwerte:** Schriftgrößen, Abstände, Radien, Schatten, Opazitäten kommen aus begrenzten, vorab definierten Skalen. NN/g: mit etwa 3 deutlich unterscheidbaren Größenstufen pro Komposition auskommen. [RUI] [NNG-VD]
5. **Nähe schlägt alles:** Zusammengehöriges eng, Getrenntes weit; Nähe überstimmt Farbe und Form. Gruppierung zuerst über Weißraum, erst dann über Linien/Boxen. Abstand *innerhalb* einer Gruppe < Abstand *zwischen* Gruppen – ohne Ausnahme. [NNG-PROX] [LoUX: Proximity, Common Region]
6. **Überschriften gehören zu ihrem Inhalt:** mehr Abstand über einer Überschrift als darunter. [IMP]
7. **Ausrichtung:** Pro Sektion eine dominante Achse. Zentrierter Text nur für kurze, isolierte Elemente (≤ ~3 Zeilen). Kein Blocksatz im Web. [BUT] [IMP]
8. **Konsistenz:** Gleiche Funktion = gleiches Aussehen (Similarity). Eine Kartenart pro Inhaltstyp, ein Button-Stil pro Priorität, ein Radius-System. Jakob's Law: Navigation, Formulare, Karussells funktionieren wie auf allen anderen Websites. [LoUX]
9. **Kontrast gezielt:** Das abweichende Element wird erinnert (Von-Restorff-Effekt) → pro Screen darf sich nur *eine* Sache farblich abheben: die primäre Aktion. [LoUX]
10. **Balance:** Symmetrisch = ruhig/statisch, asymmetrisch = dynamisch. Visuelles Gewicht (dunkel, gesättigt, groß) mit Fläche/Weißraum ausgleichen; kein Bereich darf unbeabsichtigt dominieren. [NNG-VD]
11. **Weißraum großzügig starten, dann reduzieren** – nie umgekehrt. Gedrängte Layouts sind fast immer ein Abstands-, kein Deko-Problem. [RUI]
12. **Prägnanz / Occam:** die einfachste Form, die den Zweck erfüllt. Jedes Element hat eine Aufgabe; vor Abschluss ein Element entfernen. [LoUX]
13. **Ästhetik wirkt funktional:** Schöne Oberflächen werden als bedienbarer wahrgenommen (Aesthetic-Usability-Effekt); Design-Qualität ist der erste von vier Glaubwürdigkeitsfaktoren. [LoUX] [NNG-TRUST]
14. **Struktur ist Information:** Nummern, Eyebrows, Trennlinien, Labels müssen etwas Wahres über den Inhalt codieren (echte Reihenfolge, echte Kategorie) – sonst weglassen. [IMP]

### 1.2 Typografie

1. **Der Fließtext entscheidet über die typografische Qualität**, nicht die Headline. [BUT]
2. **Fließtext 16–20 px** (Butterick: 15–25 px im Web). Lesetext nie < 16 px, nichts < 12 px. Eingabefelder mobil ≥ 16 px (sonst zoomt iOS Safari beim Fokus – Praxiswissen, ungeprüft an Quelle). [BUT] [IMP]
3. **Zeilenlänge 45–75 Zeichen.** Bandbreite der Quellen: Butterick 45–90, Baymard 50–75, Every Layout ≤ 60ch, web.dev ~66ch, WCAG 1.4.8 (AAA) ≤ 80. Umsetzung am Textcontainer in `ch` (`max-w-[65ch]`), nicht in Pixeln. [BUT] [BAY] [EL] [WD-TYPO]
4. **Zeilenhöhe:** Butterick 120–145 % für Lesetext; am Bildschirm üblich 1,5–1,65. Je größer die Schrift, desto enger: Display 1,0–1,15, Zwischenüberschriften 1,2–1,3. Zu großer Zeilenabstand bei langen Zeilen erschwert den Zeilensprung; kurze Zeilen vertragen mehr. Unitless angeben. [BUT] [WD-TYPO] [IMP]
5. **Laufweite:** große Headlines leicht enger (−0,01 bis −0,025 em), Fließtext unverändert, VERSALIEN/Kapitälchen +5–12 %. Nicht „zusammenquetschen", kein Sperren von Fließtext. [BUT] [IMP]
6. **Zwei Schriftfamilien reichen.** Vor einer zweiten Familie erst Größe/Gewicht/Laufweite variieren. Paarung über *Kontrast in der Rolle* (charaktervolle Display-Schrift, ruhige Text-/UI-Schrift) bei *verwandter Haltung*. Display-Schrift sparsam – sie wirkt nur, wenn sie nicht überall steht. [IMP]
7. **Fluid Type mit `clamp()`** mit Unter- und Obergrenze, feste Stufen. (In diesem Repo vorhanden: `--text-f-*`.) [WD-TYPO]
8. **Eine `h1` pro Seite, keine Ebenen überspringen.** Überschriften beginnen mit dem informationstragenden Wort. [IMP] [NNG-F]
9. **Mikrotypografie:** typografische Anführungszeichen („ " im Deutschen), Halbgeviertstrich für Bereiche (9–18 Uhr), geschütztes Leerzeichen vor Einheiten (35 €), keine Unterstreichung außer Links, Fett/Kursiv sparsam, keine Versalien im Fließtext. [BUT]
10. **Deutsch:** Lange Komposita (15–20 Zeichen sind normal) sprengen mobile Headlines. Headlines mit `hyphens: auto` (setzt `lang="de"` voraus – ist in `nuxt.config.ts` gesetzt) und `text-wrap: balance`; Absätze `text-wrap: pretty`. Die H1-Größe an den *längsten realen Wörtern* bei 360 px Viewport prüfen. Überschlag: Zeichenbreite ≈ 0,5 em (Serif/Grotesk normaler Weite) → 18 Zeichen bei 40 px ≈ 360 px, nutzbar sind bei 16 px Rand nur 328 px.
11. **Fonts selbst hosten.** Das LG München I (20.01.2022, 3 O 17493/20) hat die dynamische Einbindung von Google Fonts ohne Einwilligung als DSGVO-Verstoß gewertet (IP-Übermittlung an Google, 100 € Schadensersatz). **Achtung: Der Starter lädt Inter per `@import url('https://fonts.googleapis.com/…')` in `tailwind.css` – das muss in jedem Projekt vor dem Livegang ersetzt werden.** `font-display: swap`, nur benötigte Schnitte/Achsen laden. [LGM] [WD-TYPO]

### 1.3 Farbe

1. **60-30-10 als Faustregel** (aus der Innenarchitektur, keine Studie): ~60 % neutrale Grundfläche, ~30 % unterstützende Töne, ~10 % Akzent. Der Akzent gehört den Aktionen.
2. **Neutrale Töne mit Farbstich statt reinem Grau;** kein reines Schwarz für Text. Richtwert Chroma 0,005–0,03 im Marken-Hue. shadcn selbst liefert getönte Base-Colors (u. a. Stone, Zinc, Mauve, Olive, Mist, Taupe). [RUI] [SHAD]
3. **Palette vorab definieren**, nicht ad hoc per `lighten/darken`. Vorgehen nach Refactoring UI: Basiston wählen (taugt als Button-Hintergrund) → dunkelstes (Text) und hellstes (Flächentönung) Ende festlegen → Zwischenstufen füllen. Eine Website braucht 1–2 Primärtöne, wenige semantische Töne (Fehler/Warnung/Erfolg), dafür genug neutrale Stufen. [RUI-COLOR]
4. **OKLCH** (`oklch(L C H)`): L 0–1 ist wahrnehmungsgleich über alle Farbtöne (gleiche L ≈ gleiche Helligkeit → vorhersagbarer Kontrast; HSL kann das nicht), C ≈ 0–0,37 in sRGB, H in Grad (Rot ≈ 20, Gelb ≈ 90, Grün ≈ 140, Blau ≈ 220, Violett ≈ 320). Keine Hue-Verschiebung beim Aufhellen/Abdunkeln. **Die maximale Chroma hängt von Hue und L ab** – nicht jede Kombination ist in sRGB darstellbar; der Browser mappt stillschweigend um. Werte deshalb auf Gamut prüfen (Kapitel 2.3). P3-Töne nur hinter `@media (color-gamut: p3)`. [EM]
5. **Kontrast (WCAG 2.2 AA):** Text ≥ 4,5:1; großer Text (≥ 24 px, oder ≥ 18,66 px fett) ≥ 3:1; Grenzen von UI-Komponenten, bedeutungstragende Icons/Grafiken und Fokus-Indikatoren ≥ 3:1 zu angrenzenden Farben. Gilt auch für Placeholder und Hover-/Fokus-Zustände. Ausnahmen: Logos, rein Dekoratives, deaktivierte Controls. [WCAG-143] [WCAG-1411]
6. **Kein Grau auf farbigen Flächen.** Auf getönten/dunklen Flächen Sekundärtext im Hue der Fläche wählen (L/C anpassen), nicht blind per Opacity – Opacity-Text immer nachrechnen. [RUI] [IMP]
7. **Farbe nie als einziger Informationsträger** (Fehler = Farbe + Icon + Text). Aktions- und Fehlerfarbe müssen unterscheidbar sein: Liegt die Primärfarbe im Rotbereich, `--destructive` im Hue deutlich absetzen.
8. **Flächenwechsel gliedern die Seite:** wenige, klar unterscheidbare Flächen; eine dunkle/kräftige Fläche als seltener Höhepunkt, nicht als Dauerzustand.

### 1.4 Layout & Raum

1. **Ein Spacing-System** auf 4/8-px-Basis mit nach oben wachsenden Sprüngen; keine Zwischenwerte. [RUI]
2. **Drei Abstandsebenen trennen:** *in* der Komponente (4–24 px), *zwischen* Komponenten einer Sektion (24–64 px), *zwischen* Sektionen (48–128 px, fluid).
3. **Vertikaler Rhythmus:** Sektionsabstände konstant. Variation entsteht über Fläche und Komposition, nicht über wechselnde Paddings. „Überall derselbe Abstand" ist aber genauso falsch wie beliebige Abstände – die Ebenen aus 2. müssen sich sichtbar unterscheiden. [IMP]
4. **Container:** *eine* maximale Layoutbreite (üblich 1152–1280 px) und *eine* Lesebreite (~65ch). Beide Kanten wiederholen sich von Header bis Footer.
5. **Intrinsisch statt Breakpoint-Flickwerk:** Inhalte bestimmen die Umbrüche, der Designer ist „Mentor des Browsers, nicht sein Mikromanager"; mobile first. Test bei 360 / 768 / 1280 / 1536 px; kein horizontaler Überlauf. [EL]
6. **Dramaturgie einer Landing Page:** Versprechen + Aktion → Nutzen/Beweis → Angebot → Person/Vertrauen → Ablauf → Emotion (Bilder) → Stimmen → Einwände (FAQ) → Aktion. Messwerte NN/g: 57 % der Betrachtungszeit above the fold, 74 % in den ersten zwei Screens; innerhalb des ersten Screens > 65 % in der oberen Hälfte → Wichtigstes nach oben. **„Illusion of completeness" vermeiden:** der erste Screen muss erkennbar weitergehen (angeschnittener Folgeinhalt, kein 100vh-Hero mit leerem Rand). [NNG-SCROLL]
7. **Abwechslung vs. Konsistenz:** Kompositionsmuster wechseln (Split, Raster, Band, Karussell, asymmetrisches Raster), *Bausteine* bleiben gleich (Typo, Karten, Buttons, Abstände). Nie zweimal direkt hintereinander dasselbe Muster; „drei gleiche Karten" höchstens einmal pro Seite. [IMP] [925]
8. **Peak-End & Serial Position:** Menschen erinnern Höhepunkt, Anfang und Ende – ein visueller Höhepunkt in der Seitenmitte, ein starker, ruhiger Schluss. [LoUX]

### 1.5 Komponenten

1. **Buttons – Hierarchie über Stil, nicht nur Farbe:** genau *eine* Primäraktion pro Ansicht (gefüllt), Sekundäraktion als Outline/leise Fläche, Tertiäres als Link/Ghost. Destruktiv ≠ automatisch groß und rot. Beschriftung = Verb + Objekt („Angebot anfordern", nicht „Absenden"); dieselbe Aktion heißt überall gleich. [RUI]
2. **Trefferflächen:** Minimum 24 × 24 CSS-px (WCAG 2.5.8 AA), für wichtige Aktionen 44–48 px (WCAG 2.5.5 AAA; Apple HIG 44 pt – aus Vorwissen). shadcn-Defaults sind knapp: `size="default"` = 36 px, `lg` = 40 px → Haupt-CTAs per `class="h-12 px-7 text-base"` anheben. Fitts: wichtige Ziele groß und nah. [WCAG-258] [LoUX]
3. **Cards:** *Entweder* Kante *oder* Schatten definiert die Fläche – nicht Haarlinie plus breiter Schatten. Keine Karten in Karten. Karte nur, wenn der Inhalt ein abgeschlossenes, vergleichbares Objekt ist; Listen, USPs, Schritte brauchen keine. Hinweis: shadcn-`Card` bringt `border` + `shadow-sm` mit → bewusst eines abschalten (`class="shadow-none"`) oder den Schatten-Token sehr leise machen. [IMP] [RUI]
4. **Radius:** ein System aus einer Basisgröße (`--radius`; shadcn leitet `sm/md/lg/xl` daraus ab). Radius skaliert mit der Elementgröße; keine extremen Radien an großen Karten. [RUI] [IMP] [SHAD]
5. **Formulare:** kurz halten; einspaltig (Ausnahme: kurze zusammengehörige Felder wie PLZ/Ort); Label *über* dem Feld, dauerhaft sichtbar; **kein Placeholder als Label**; Feldbreite ≈ erwartete Eingabe; optionale Felder kennzeichnen (max. 1–2); Formatvorgaben vorab nennen und Eingaben tolerant annehmen (Postel); Fehler direkt am Feld mit Text + Farbe + Icon, Eingabe bleibt erhalten; kein Reset-Button. NN/g: regelkonforme Formulare 78 % Erfolg im ersten Versuch vs. 42 %. [NNG-FORM] [LoUX]
6. **Bilder:** feste Seitenverhältnisse pro Kontext (`AspectRatio`), `object-cover`, `width`/`height` gesetzt (kein Layout-Shift). Helle Bilder auf hellen Flächen bekommen eine feine Innenkante, damit sie nicht auslaufen. Text auf Bildern nur mit Overlay und nachgerechnetem Kontrast – besser vermeiden. Echte, spezifische Bilder statt generischem Stock; Bilder aus allen Phasen der Leistung wirken glaubwürdiger als nur Endergebnisse. [RUI] [NNG-TRUST] [IMP]
7. **Icons:** eine Familie (hier lucide), eine Strichstärke, feste Größen (16/20/24). Icons nicht frei hochskalieren – für große Darstellungen in eine Form setzen oder weglassen. Icons ersetzen keinen Text. Listen mit Icons statt Bullets nur, wenn das Icon etwas aussagt. [RUI]
8. **Karussell:** kein Autoplay (mobil nie; Bewegtes wird wie Werbung ignoriert); wenige Frames (NN/g: ≤ 5 für Botschafts-Karussells; Bildgalerien vertragen etwas mehr – Einschätzung); Bedienelemente groß und *im* Karussell; Position/Anzahl anzeigen; nächstes Element anschneiden. [NNG-CAR]
9. **Accordion:** geeignet, wenn Nutzer nur einzelne Teile brauchen (FAQ); ungeeignet, wenn fast alles gelesen werden soll. Ganze Zeile klickbar, Caret oder Plus als Indikator, mehrere gleichzeitig offen erlauben. [NNG-ACC]
10. **Leerzustände und Fehlerseiten sind gestaltete Zustände**, keine Reste: sagen, was los ist und was man tun kann. [RUI]

### 1.6 Tiefe & Feinschliff

1. **Schatten als kleine Skala** (RUI: ~5 Stufen genügen, Websites meist 3), zweiteilig (enger Kontaktschatten + weicher Umgebungsschatten), Schattenfarbe = getönter Dunkelton des Projekts statt reinem Schwarz. In Tailwind v4 als Theme-Variablen `--shadow-xs/sm/md…` in `@theme` überschreibbar. [RUI] [TW]
2. **Elevation hat Bedeutung:** höher = temporärer/interaktiver (Dialog > Popover > Hover-Karte > ruhende Fläche). Ruhender Inhalt ist flach.
3. **Borders:** dekorative Linien leise (~1,2–1,4:1 zur Fläche), *funktionale* Grenzen (Inputs, Checkboxen) ≥ 3:1. shadcn trennt das bereits: `--border` vs. `--input`. Der shadcn-Default für `--input` (L 0,922 auf Weiß) erfüllt 3:1 nicht. [WCAG-1411]
4. **Motion-Dauern:** ~100 ms Mikro-Feedback (Checkbox, Toggle), 200–300 ms größere Wechsel (Modal, Accordion), > 400–500 ms wirkt träge; Ease-out als Standard; Eintritt etwas länger als Austritt; nichts linear. Reaktion des Systems < 400 ms (Doherty). Nur `opacity`/`transform` animieren. [NNG-ANIM] [LoUX] [IMP]
5. **`prefers-reduced-motion`:** dekorative Bewegung (Reveals, Parallax, Autoplay) entfällt, funktionales Feedback bleibt. Hintergrund: vestibuläre Störungen (Schwindel, Übelkeit). Inhalte müssen *ohne* Animation und ohne JS sichtbar sein – keine „unsichtbar bis IntersectionObserver"-Muster. Tailwind: `motion-reduce:` / `motion-safe:`. [WD-PRM] [IMP]
6. **States vollständig:** Hover, Focus-visible, Active, Disabled für alles Interaktive. Fokus sichtbar mit ≥ 3:1 – auf *jeder* Fläche, auf der das Element vorkommt. Hover ist nie die einzige Auffindbarkeit (Touch).
7. **Eine orchestrierte Bewegung wirkt stärker als viele verstreute** – und viele verstreute sind ein Template-Signal. [IMP]

### 1.7 UX & Conversion

1. **Eine Seite, ein Ziel.** Das Ziel (Anruf, Anfrage, Kauf, Termin) bestimmt die primäre Aktion; sie heißt überall gleich und ist von jeder Sektion aus in Sichtweite.
2. **CTA-Platzierung:** Header (dauerhaft), Hero, nach dem Angebot, am Seitenende. Für lokale Geschäfte: Telefonnummer als `tel:`-Link, mobil mit einem Tap erreichbar; Adresse/Öffnungszeiten ohne Suchen auffindbar. *(Belegt ist der Grundsatz „Kontaktdaten offen zeigen" [NNG-TRUST]; konkrete Conversion-Prozentwerte aus Marketing-Blogs sind nicht belastbar und hier bewusst nicht zitiert.)*
3. **Hick's Law / Choice Overload:** max. 2 Aktionen nebeneinander, Hauptmenü ≤ ~6 Punkte, Formular so wenige Felder wie möglich. Chunking: Gruppen von 3–5. [LoUX]
4. **Vertrauen – 4 Faktoren (NN/g):** (a) Design-Qualität, keine Tippfehler/toten Links; (b) **Offenheit**: Kontakt, Preise bzw. Preisrahmen, Bedingungen sichtbar – nicht erst auf Nachfrage; (c) vollständige, korrekte, aktuelle Inhalte; (d) Verbindung zum Rest des Webs (Bewertungsportale, Social-Profile, Presse). [NNG-TRUST]
5. **Social Proof nur, wenn er trägt:** echte Namen/Quellen; zu kleine Zahlen schaden („nur 12 Bewertungen"); nicht überladen. Trust-Elemente wirken am besten nahe an der Aktion (Praxisregel, schwach belegt). [NNG-SP]
6. **Lesefluss:** Nutzer scannen. F-Muster entsteht bei unformatiertem Text und ist ein *Symptom*, kein Ziel. Gegenmittel: Wichtiges in die ersten zwei Absätze, aussagekräftige (Zwischen-)Überschriften mit Informationswort vorn, Gruppierung, Listen, sparsam Fettungen, sprechende Linktexte, Überflüssiges streichen. Z-Muster im Kopfbereich: Logo → Header-CTA → Headline → Aktion. [NNG-F]
7. **Kognitive Last senken:** bekannte Muster, klare Gruppen, Komplexität nicht auf den Nutzer abwälzen (Tesler). Fortschritt sichtbar machen, wo es Schritte gibt (Goal-Gradient). [LoUX]
8. **Texte sind Designmaterial:** aus Nutzersicht benennen, aktiv formulieren, konkret statt clever (Ort, Zeit, Preis, Umfang), Fehlermeldungen sagen was passiert ist und was zu tun ist.
9. **Accessibility ist Pflicht:** Kontraste (1.3.5), Tastaturbedienung, sichtbarer Fokus, Alt-Texte (dekorative Bilder `alt=""`), Labels, Landmarken/`aria-labelledby`, reduzierte Bewegung, 200 % Zoom ohne Überlauf, Zielgrößen.

### 1.8 Anti-Patterns – „sieht nach Template/AI aus"

| Tell | Stattdessen |
|---|---|
| Unberührte Defaults: shadcn-Grau, Tailwind-Blau/Indigo, Inter für alles [925] [IMP] | Tokens aus Marke/Bildwelt ableiten, eigene Schriftpaarung |
| Lila-/Blau-Verläufe, Gradient-Text, Glow, Glassmorphism, Deko-Raster, Radial-„Spotlights" | Volltonflächen; Emphase über Größe/Gewicht/Raum |
| Zentrierter Hero mit schwebendem CTA; überdimensionierte Headline | linksbündig/Split, Inhalt trägt; Headline so groß, dass der Screen noch erklärt |
| Drei identische Feature-Karten (Icon oben, Titel, zwei Zeilen) – mehrfach | Komposition pro Inhalt variieren; nicht alles ist eine Karte |
| Icon in farbiger Kachel über der Überschrift | Icon neben den Text oder weglassen |
| Badge/Eyebrow über jeder Headline | nur, wenn er Information trägt |
| „01 / 02 / 03" als Deko | Nummern nur bei echter Reihenfolge |
| Karten in Karten; Haarlinie + breiter Schatten; extremer Radius; Akzent-Randstreifen an runden Karten | flach, eine Kante *oder* ein Schatten, moderater Radius |
| Überall gleiche Abstände | eng innerhalb, weit zwischen Gruppen |
| Bounce/Elastic, Scroll-Reveals überall, Bild-Zoom beim Hover, pulsierende Punkte, Marquees | eine orchestrierte Bewegung, sonst Ruhe |
| Generische Claims, erzwungene Gegensätze („Nicht nur X, sondern Y"), Gedankenstrich-Kaskaden | konkret: was, wo, wann, wie viel |
| Reflex-Looks unabhängig vom Thema: (a) Creme + kontrastreiche Serif + Terrakotta, (b) Fast-Schwarz + Neon-Akzent, (c) Zeitungslayout mit Haarlinien und Radius 0 | legitim, wenn aus dem Thema begründet – nie als Default |
| Kursive Serif-Headline als „Eleganz" | Stil aus dem Charakter des Projekts |
| Grauer Text auf Farbfläche, kontrastarme „Eleganz" | nachgerechnete Kontraste |
| Grobe Pseudo-Illustrationen, Platzhalterbilder, gezackte Freisteller | hochwertige, spezifische Bildwelt – oder keine |

---

## 2. Die Methode – vom Briefing zum Projektkonzept

Reihenfolge einhalten. Ergebnis jedes Schritts landet in der Vorlage (Kapitel 4).

### 2.1 Gegenstand festnageln, Leitidee formulieren

- Festhalten: *Was* ist das Unternehmen, *wer* kommt auf die Seite, *was ist die eine Aufgabe* der Seite.
- Material sichten: Logo, Illustrationen, Fotos, Drucksachen, Ladengeschäft, Produkte. **Bilder wirklich ansehen** (Read-Tool), nicht nur Dateinamen.
- Leitidee in 2–3 Sätzen: eine Metapher/Haltung aus der Welt des Gegenstands (Materialien, Werkzeuge, Artefakte), aus der sich Fläche, Schrift, Tiefe und Bildbehandlung ableiten lassen.
- **Eine Signatur** benennen – das eine Merkmal, an dem man die Seite wiedererkennt. Alles andere bleibt diszipliniert. Mut an *einer* Stelle ausgeben.
- **Gegenprobe:** Würde dieselbe Leitidee auch für ein beliebiges anderes Projekt derselben Branche herauskommen? Entspricht sie einem der Reflex-Looks aus 1.8? Dann überarbeiten und aufschreiben, was geändert wurde. Auch die „naheliegende Branchenfarbe" hinterfragen.
- Prüfen, ob die Idee die *gesamte* Bandbreite der Inhalte trägt (z. B. fröhliche und ernste Anlässe, B2B und B2C).

### 2.2 Palette aus den Assets ableiten

1. **Messen statt schätzen.** Aus jedem Asset die tragenden Farben als Mittelwert einer kleinen Fläche (z. B. 9 × 9 px) nehmen – Einzelpixel sind bei JPG/Aquarell/Foto unzuverlässig. Unter Windows ohne Zusatzpakete:
   ```powershell
   Add-Type -AssemblyName System.Drawing
   $bmp = New-Object System.Drawing.Bitmap "C:\pfad\bild.jpg"
   $x=430; $y=600; $r=0;$g=0;$b=0;$n=0
   for($dx=-4;$dx -le 4;$dx++){for($dy=-4;$dy -le 4;$dy++){$c=$bmp.GetPixel($x+$dx,$y+$dy);$r+=$c.R;$g+=$c.G;$b+=$c.B;$n++}}
   "#{0:X2}{1:X2}{2:X2}" -f [int]($r/$n),[int]($g/$n),[int]($b/$n); $bmp.Dispose()
   ```
   Immer auch den **Bildhintergrund** messen (Papier, Studio-Weiß): er ist fast nie `#FFFFFF` und entscheidet über Flächenton und Blend-Verhalten (3.5).
2. **Nach OKLCH umrechnen** (`hex2oklch` im Skript 2.3). Die Messwerte liefern *Hue-Anker*; L und C werden für die jeweilige Rolle neu gesetzt. Tabelle „Quelle → Hex → OKLCH → wird zu Token" ins Konzept.
3. **Rollen auf die shadcn-Variablen verteilen.** Zweck der Tokens [SHAD] und worauf zu achten ist:

   | Token(-Paar) | Zweck im System | Hinweis |
   |---|---|---|
   | `background` / `foreground` | Seitenfläche, Haupttext | getöntes Fast-Weiß; Text getöntes Fast-Schwarz (L ~0,2) |
   | `card`, `popover` (+ `-foreground`) | erhabene Flächen, Overlays | meist heller als `background` |
   | `primary` (+ `-foreground`) | Aktion mit hoher Betonung, Marke | **die eine Aktionsfarbe**; L so wählen, dass `primary-foreground` ≥ 4,5:1 hat (bei Weiß-Text meist L ≲ 0,55) |
   | `secondary` (+ `-foreground`) | leiser gefüllter Button/Badge | im shadcn-Sinn *zurückhaltend*; wird in diesem Repo zusätzlich als Sektionsfläche benutzt (3.1) |
   | `muted` / `muted-foreground` | zurückgenommene Flächen / Sekundärtext | `muted-foreground` muss auf **allen** hellen Flächen ≥ 4,5:1 erreichen |
   | `accent` (+ `-foreground`) | Hover-/Aktiv-Fläche von Ghost/Outline-Buttons, Menü-, Select-, Command-Items (in > 40 `ui/`-Dateien) | **muss eine leise Tönung bleiben** – keine kräftige „Akzentfarbe" hier ablegen |
   | `destructive` | Fehler | vom `primary`-Hue absetzen |
   | `border` | dekorative Linien | leise |
   | `input` | Kontur von Formularfeldern | ≥ 3:1 anstreben |
   | `ring` | Fokus; Komponenten nutzen `ring-ring/50` (3 px) und `outline-ring/50` | wegen der 50 % Alpha muss `--ring` **sehr dunkel** sein, damit der Halo 3:1 erreicht (2.3) |
   | `chart-1…5` | Diagrammfarben | sinnvoll: die Schmuckfarben der Bildwelt ablegen |
   | `sidebar-*` | Sidebar-Komponente | auf die Haupttokens spiegeln (`var(--card)` …) |
4. **Neutrale mit Farbstich:** alle Grautöne (foreground, muted, border, input) bekommen denselben Hue (aus Marke/Bildwelt) mit niedriger Chroma.
5. **Zusätzliche Tokens** nur bei echtem Bedarf (z. B. eine Dunkelfläche, die nicht Aktionsfarbe ist; Tönungsflächen). shadcn-Weg: in `:root` (und `.dark`) definieren, in `@theme inline` als `--color-<name>: var(--<name>)` registrieren → `bg-<name>` / `text-<name>`. Keine Dubletten: deckt ein vorhandener Token die Rolle, diesen benutzen. [SHAD]
6. **Verteilung prüfen** (60-30-10): Wo taucht die Aktionsfarbe auf? Wenn sie auch Flächen, Badges, Icons, Überschriften färbt, ist sie keine Aktionsfarbe mehr.

### 2.3 Kontraste nachrechnen

Nicht schätzen, nicht nur im Picker ansehen – rechnen. Kompaktes Node-Skript ohne Abhängigkeiten (OKLCH ↔ sRGB nach Björn Ottosson, WCAG-2-Formel; Alpha-Mischung im gamma-codierten sRGB wie im Browser):

```js
// contrast.mjs – node contrast.mjs
const enc = x => x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
const dec = x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
const clamp = v => Math.min(1, Math.max(0, v))
export function lin([L, C, h]) {               // OKLCH -> lineares sRGB
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}
export const inGamut = c => lin(c).every(v => v >= -0.0005 && v <= 1.0005)   // sRGB darstellbar?
export const hex = c => '#' + lin(c).map(v => Math.round(enc(clamp(v)) * 255).toString(16).padStart(2, '0')).join('')
const lum = c => { const [r, g, b] = lin(c).map(clamp); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
export function hex2oklch(h) {
  const [r, g, b] = [1, 3, 5].map(i => dec(parseInt(h.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360]
}
export function mix(fg, bg, alpha) {           // fg mit Alpha über bg, wie der Browser (gamma-sRGB)
  const f = lin(fg).map(v => enc(clamp(v))), g = lin(bg).map(v => enc(clamp(v)))
  return hex2oklch('#' + f.map((v, i) => Math.round((v * alpha + g[i] * (1 - alpha)) * 255).toString(16).padStart(2, '0')).join(''))
}
// Beispielaufrufe:
// contrast([0.47,0.025,145],[0.972,0.008,112])          Text auf Fläche
// contrast(fgOnPrimary, mix(primary, background, 0.9))  Button-Hover `bg-primary/90`
// contrast(mix(ring, surface, 0.5), surface)            Fokus-Halo `ring-ring/50`
```

**Pflicht-Paare** (jeweils gegen *jede* Fläche, auf der das Element vorkommt – im Repo mindestens die vier Sektionsflächen plus `card`):

| Paar | Ziel |
|---|---|
| `foreground` auf background / card / secondary / muted / accent / eigene Tönungen | ≥ 4,5 (real meist > 12) |
| `muted-foreground` auf denselben Flächen | ≥ 4,5 |
| `primary-foreground` auf `primary` | ≥ 4,5 |
| `primary-foreground` auf **`primary/90` über der Fläche** (shadcn-Button-Hover: `hover:bg-primary/90`) | ≥ 4,5 – Hover hellt auf hellem Grund auf und kostet Kontrast |
| `primary` als Text/Link auf allen hellen Flächen | ≥ 4,5 |
| `secondary-foreground`/`secondary`, `accent-foreground`/`accent` | ≥ 4,5 |
| `destructive` als Text auf hellen Flächen; Weiß auf `destructive` (Button setzt `text-white`) | ≥ 4,5 |
| `input` auf den Flächen, auf denen Formulare stehen | ≥ 3 |
| **`ring` mit 50 % Alpha** über jeder Fläche, gegen diese Fläche | ≥ 3 |
| Text und Sekundärtext auf jeder dunklen/kräftigen Fläche; **Opacity-Varianten explizit** (z. B. `…-foreground/70`, siehe `mutedClass()` in 3.3) | ≥ 4,5 |
| Aktions-Button *als Form* auf dunkler Fläche (Button-Fläche gegen Sektionsfläche) | ≥ 3, sonst dort einen hellen Button verwenden |
| bedeutungstragende Icons in ihrer Farbe | ≥ 3 |
| `border` auf Flächen | dekorativ, ~1,2–1,4 genügt |

**Fallstricke:**
- *Opacity-Text* (`text-foreground/70`, `text-primary-foreground/80`) ist eine neue Farbe – immer mit `mix()` rechnen. Auf kräftigen Flächen fällt er schnell unter 4,5.
- *Hover-Zustände* mit Alpha (`/90`, `/80`) hängen von der Fläche darunter ab.
- *Fokusring:* Mit dem shadcn-Default (`--ring` mittelgrau, 50 % Alpha) liegt der Halo weit unter 3:1. Rechnerische Erfahrung: Erst bei `--ring` mit L ≈ 0,22 erreicht der 50-%-Halo auf hellen Flächen ~3,2:1. Auf dunklen Flächen braucht der Ring eine helle Farbe (3.4, Token-Scope).
- *Gamut:* `inGamut()` für jeden Token prüfen; sehr helle Töne vertragen nur minimale Chroma (bei L > 0,94 oft < 0,03).
- *Browser-Gegenprobe* am Ende mit DevTools an Stichproben – das Skript ersetzt nicht den Blick auf echte Komponenten.
- WCAG 2 bewertet dunkle Paare teils zu freundlich (bekannte Schwäche, APCA als Alternative – aus Vorwissen); bei hellem Text auf mittleren Tönen Reserve einplanen (≥ 5:1).

Durchgefallene Kombinationen **im Konzept als verboten dokumentieren** – das ist genauso wertvoll wie die bestandenen.

### 2.4 Schrift wählen und selbst gehostet einbinden

**Auswahlkriterien:**
- Aus der Welt des Gegenstands und der Bildwelt begründen (Strichcharakter, Epoche, Material) – nicht die Schrift, die man immer nimmt. Reflex-Wahlen aus 1.8 meiden.
- Rollen: Display (charaktervoll, sparsam) + Text/UI (ruhig, gut lesbar bei 14–18 px, funktioniert in Buttons/Inputs/Labels). Eine klare, prüfbare Rollenregel festlegen („Display nur in h1–h3 und Zitaten").
- Frei lizenziert (OFL), vollständiger deutscher Zeichensatz (ä ö ü ß, „ "), benötigte Gewichte vorhanden; variable Fonts bevorzugen.
- Die Schrift muss *alle* Tonlagen der Inhalte tragen (verspielte Alternativformen ggf. über Achsen/Features abschalten).
- Headline-Schrift mit den längsten realen Wörtern bei 360 px testen (1.2.10).

**Einbindung (DSGVO, 1.2.11):**
1. Paket prüfen: `https://registry.npmjs.org/@fontsource-variable/<name>/latest` (nicht jede Schrift gibt es variabel; sonst `@fontsource/<name>`). Dateiliste ansehen (`https://cdn.jsdelivr.net/npm/@fontsource-variable/<name>/`): `index.css` = nur Gewichtsachse; Schriften mit Zusatzachsen haben z. B. `opsz.css`, `full.css`, `*-italic.css`.
2. `yarn add @fontsource-variable/<display> @fontsource-variable/<text>`.
3. In `app/assets/css/tailwind.css` den Google-Fonts-`@import` **ersetzen**:
   ```css
   @import "@fontsource-variable/<text>/index.css";
   @import "@fontsource-variable/<display>/index.css";   /* oder full.css o. ä. */
   ```
   Der Familienname variabler Fontsource-Pakete lautet `'<Name> Variable'` (in der CSS-Datei nachsehen). Kursive nur laden, wenn sie gebraucht werden.
4. Tokens: In `@theme inline` existiert bereits `--font-heading: var(--font-sans)` → `--font-sans` auf die Textschrift, `--font-heading` auf die Display-Schrift setzen (mit System-Fallbacks). Utilities: `font-sans`, `font-heading`.
5. Basis-Stile in `@layer base`: `h1–h3` → `font-family: var(--font-heading)`, `text-wrap: balance`, `hyphens: auto`; `p, li` → `text-wrap: pretty`; Achsen per `font-variation-settings`, `font-optical-sizing: auto`.
6. Abnahme: im Network-Tab kein Request an `fonts.googleapis.com` / `fonts.gstatic.com`.

### 2.5 Typo-Skala auf `--text-f-*` aufbauen

Vorhanden (in `@theme inline`, nutzbar als `text-f-lg` … `text-f-9xl`): `f-lg` 16–18 · `f-xl` 16–20 · `f-2xl` 18–24 · `f-3xl` ~25–30 · `f-4xl` 28–36 · `f-5xl` 32–48 · `f-6xl` ~39–60 · `f-7xl` ~45–72 · `f-8xl` 56–96 · `f-9xl` ~71–128 px.

- Eine **Rollentabelle** festlegen: H1, H2, H3, Lead, Fließtext, UI/Meta, ggf. Zitat/Preis/Ziffer – je Klasse, Schrift/Gewicht, Zeilenhöhe, Laufweite. 5–7 Rollen genügen; nicht jede Stufe der Skala verwenden.
- Bewährter Startpunkt: Fließtext `text-f-lg`, Lead `text-f-xl`, H3 `text-f-2xl`, H2 `text-f-5xl`, H1 `text-f-6xl`. Größere Stufen nur mit Test der längsten Wörter.
- Maximalbreiten definieren: Lesetext `max-w-[65ch]`, Lead ~60ch, Headlines über `max-w-[..ch]` auf 2–3 Zeilen steuern.
- Pro Sektion ≤ 3 sichtbare Schriftgrößen.
- **Rich-Text aus dem CMS** (`v-html` + `sanitizeHtml`) bekommt keine Klassen → Basis-Stile für `h2/h3/p/ul/ol/a/blockquote` im `@layer base` oder als `@utility` (nicht `@apply` auf Komponentenklassen, 3.4).
- Ist-Zustand prüfen: Blöcke können feste Größen tragen (Stand der Prüfung: `BlockIntro.vue` → `h2` mit `text-3xl font-semibold`, `Hero.vue` → `h1` mit `text-4xl … lg:text-5xl font-extrabold`). Beim Styling auf die Rollentabelle umstellen.

### 2.6 Rhythmus auf `--spacing-f-*`

Vorhanden: `f-6` (16–24) · `f-8` (24–32) · `f-12` (32–48) · `f-16` (36–64) · `f-20` (44–80) · `f-24` (48–96) … `f-96`; nutzbar als `pt-f-24`, `gap-f-8`, `mb-f-12` usw.

- Sektionsabstand kommt aus `BlockSection` (`pt-f-24`, optional `pb-f-24`) – nicht pro Block überschreiben (3.2).
- Wenige feste Werte je Ebene definieren, z. B.: Sektionskopf → Inhalt `mb-f-12`; Spalten-Gap in Split-Layouts `gap-f-16`; Karten-Gap `gap-f-8`; innerhalb von Komponenten nur 4/8/12/16/24 px; Card-Innenabstand bleibt shadcn-Standard.
- Einen Container festlegen und überall verwenden. Stand der Prüfung: Blöcke nutzen `mx-auto w-full max-w-6xl px-4 md:px-8`, der Text-Block `max-w-3xl`.
- Raster: Split-Layouts eher asymmetrisch (7/5, 5/7) als 6/6; Kartenraster 1 → 2 → 3 (→ 4). Abfolge der Kompositionsmuster für die ganze Seite einmal aufschreiben (1.4.7).

### 2.7 Dark-Block konsistent mitziehen

`tailwind.css` enthält einen `.dark`-Block, und viele `ui/`-Komponenten tragen `dark:`-Klassen. Auch wenn das Projekt keinen Dark Mode anbietet: den Block mit zur Palette passenden Werten füllen (gleiche Hues, L invertiert; Primärfarbe heller mit dunklem `primary-foreground`; `border`/`input` als Weiß mit Alpha wie im shadcn-Default) und die Hauptpaare rechnen. Zusätzliche Projekt-Tokens dort ebenfalls definieren. Ob Dark Mode angeboten wird, ist eine Konzeptentscheidung – Multiply-Bilder (3.5) funktionieren dort z. B. nicht.

### 2.8 Radius, Schatten, Motion festlegen

- `--radius` einmal setzen (shadcn-Default 0,625rem); daraus folgen `rounded-sm/md/lg/xl`. Aufschreiben, welches Element welche Stufe bekommt.
- Schatten: 3 Stufen in `@theme` (`--shadow-xs`, `--shadow-sm`, `--shadow-md`), getönt; festlegen, wofür jede steht. Entscheidung „Kante oder Schatten" für Karten treffen.
- Motion: die *eine* orchestrierte Bewegung benennen (oft: Hero-Einstieg per CSS, `tw-animate-css` ist installiert: `animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both` + gestaffelte `delay-*`, mit `motion-reduce:animate-none`), sonst nur Zustandsübergänge 150–300 ms. Negativliste ins Konzept.

### 2.9 Sektion für Sektion

Für jede Sektion/Seite festhalten: Fläche, `paddingBottom`, Kompositionsmuster, Inhaltshierarchie (was ist Ebene 1/2/3), eingesetzte Komponenten mit Varianten, Bildformat, Verhalten mobil, Aktion. Eine Tabelle „# · Sektion · Fläche · pb" vorweg macht den Flächenrhythmus prüfbar.

---

## 3. Systemwissen dieses Repos

Am Code geprüft (Branch-Stand der Erstellung dieser Datei). Vor Gebrauch kurz gegenlesen – Blöcke ändern sich pro Projekt.

### 3.1 Die vier Flächen von `BlockSection.vue`

Jeder Block rendert sich in `<BlockSection :anchor :background :padding-bottom>`. Das CMS-Feld `background` (aus `blockCommon()` in `scripts/lib/fields.mjs`) kennt vier **Keys**, die `BlockSection` auf Klassen mappt:

| Key | Klassen im Starter |
|---|---|
| `white` (Default) | `bg-white text-foreground` |
| `background` | `bg-background text-foreground` |
| `primary` | `bg-primary text-primary-foreground` |
| `secondary` | `bg-secondary text-secondary-foreground` |

- Die Keys sind reine Bezeichner. **Pro Projekt anpassbar** sind: die Token-Werte (`tailwind.css`), die CMS-Labels (`BG_CHOICES` bzw. `blockCommon(default, choices)`) und – weil `BlockSection.vue` keine shadcn-Komponente ist – das Mapping selbst.
- `white` ist hart `bg-white`. Bei getöntem `--background` wirkt reines Weiß daneben schnell kalt → erwägen, `white` auf `bg-card` zu mappen.
- **Rollenkonflikt `primary`:** `--primary` ist zugleich Button-Farbe. Eine vollflächige Sektion in der Aktionsfarbe entwertet den Akzent (1.3.1) und der Primär-Button verschwindet darauf. Optionen: (a) Key `primary` selten/gar nicht als Fläche nutzen; (b) den Key in `BlockSection` auf einen eigenen Flächen-Token mappen (z. B. `bg-<dunkelton> text-<dunkelton>-foreground`) und das Label anpassen – dann **`mutedClass()` mit anpassen** (3.3).
- **Rollenkonflikt `secondary`:** Im shadcn-Sinn ist `secondary` ein *leiser* Ton (Button/Badge `variant="secondary"`). Wer ihn als dunkle Sektionsfläche definiert, macht alle Secondary-Buttons und -Badges dunkel und `mutedClass()` greift nicht. Empfehlung: `secondary` hell lassen (getönte Alternativfläche).
- Der Footer (`Website/Footer.vue`) und der Header sind keine Blöcke und haben eigene Klassen.
- Regeln für den Flächenrhythmus ins Konzept: wie viele Flächen, welche wofür, kräftige/dunkle Fläche max. 1× im Seitenkörper und nicht direkt vor einem gleichfarbigen Footer, benachbarte Sektionen wechseln die Fläche außer bei inhaltlicher Einheit.

### 3.2 `paddingBottom` – Regel nach der Geometrie

`BlockSection` setzt **immer** `pt-f-24` und `pb-f-24` **nur**, wenn das Flag `paddingBottom` gesetzt ist (Default `false`). Daraus folgt:

- Nächste Sektion hat eine **andere** Fläche → `paddingBottom = true`. Sonst klebt der Inhalt an der Farbkante.
- Nächste Sektion hat **dieselbe** Fläche → `paddingBottom = false`. Das `pt` der nächsten Sektion ist der Abstand; mit Flag entstünde doppelter Leerraum.
- Letzte Sektion vor dem Footer → `true`.

Der Feldhinweis im CMS (`blockCommon()` in `scripts/lib/fields.mjs`) beschreibt genau diese Regel; `yarn directus:schema` gleicht Hinweistexte auch auf bestehenden Instanzen ab.

### 3.3 `mutedClass()` – Sekundärtext auf Flächen

`app/composables/useBlock.ts` exportiert (auto-importiert):
```ts
mutedClass(background) → background === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
```
Verwendet in `BlockIntro.vue` (Intro-Text), `blocks/Hero.vue`, `blocks/Faq.vue`. Konsequenzen:
- Sekundärtext in Blöcken **immer** über `mutedClass(block.background)` setzen, nie hart `text-muted-foreground`.
- Die `/70`-Opacity ist pro Palette **nachzurechnen** (2.3); reicht sie nicht, Wert erhöhen oder einen eigenen Token (`--<fläche>-muted`) einführen und hier zurückgeben.
- Die Funktion kennt nur den Key `primary`. Wird eine andere Fläche dunkel/kräftig oder der Key umgemappt, muss sie erweitert werden.
- `<BlockIntro :heading :intro :heading-id :background :center>` ist der gemeinsame Sektionskopf (H2 + Intro, `mb-10 max-w-2xl`, optional zentriert) – Typo-/Abstandsentscheidungen für Sektionsköpfe an *dieser einen* Stelle umsetzen.

### 3.4 Bekannte Stolperstellen

1. **Outline-Button auf dunkler Fläche:** `variant="outline"` setzt `bg-background`, aber keine Textfarbe (nur beim Hover). In einer Sektion mit heller Schrift (`text-primary-foreground`) erbt er diese → hell auf hell, unlesbar. Abhilfe: `class="text-foreground"` am Button oder am umgebenden Element. Stand der Prüfung: `blocks/Gallery.vue` (`<Carousel class="text-foreground">`) und `blocks/Hero.vue` (zweiter CTA, `class="text-foreground"`) lösen das bereits – bei neuen Blöcken mit Outline-Buttons daran denken. Gleiches Prinzip für alle Komponenten ohne eigene Textfarbe (Inputs sind `bg-transparent`, Accordion erbt). `Card` und `Badge variant="outline"` setzen ihre Textfarbe selbst.
2. **Primär-Button auf kräftiger/dunkler Fläche:** Kontrast Button-Fläche ↔ Sektionsfläche prüfen (2.3); oft ist dort ein heller Button die richtige Hauptaktion.
3. **Carousel-Pfeile:** `CarouselPrevious/Next` sind per Default absolut bei `-left-12` / `-right-12` positioniert – außerhalb des Containers, mobil Überlauf bzw. abgeschnitten. Per `class` nach innen holen (Stand: `Gallery.vue` und `pages/sortiment/[slug].vue` nutzen `class="left-3"` / `right-3"`) oder per `class="static translate-y-0"` in eine Kopfzeile setzen.
4. **Fokus auf dunklen Flächen:** Ein dunkler `--ring` ist dort unsichtbar. Einfachste Lösung: Token im Scope der Fläche überschreiben, z. B. in `BlockSection` für die dunkle Fläche `[--ring:var(--…-foreground)]` (gleiches Prinzip wie `.dark`; Technik ist Standard-CSS, in diesem Repo noch ungeprüft). Analog `--border`.
5. **Tailwind v4:** kein `@apply` auf Component-Klassen innerhalb von `@layer components` – killt den CSS-Build ohne sichtbaren Fehler; `@utility` verwenden. (`@apply` von Utilities im `@layer base`, wie im Starter vorhanden, ist in Ordnung.) Nach CSS-Änderungen `yarn build` bzw. die gerenderte Seite prüfen.
6. **Feste Werte in Blöcken:** Blöcke können Tailwind-Festwerte statt der fluiden Skala tragen (`text-3xl`, `mb-10`, `gap-10`, Stand der Prüfung) – beim Styling gezielt auf die Rollen aus dem Konzept umstellen, nicht mischen.
7. **Mobile-Screenshots** nicht über `--window-size < 500` (Chrome hält eine Mindestbreite) – per CDP-Emulation; Überlauf über `scrollWidth == clientWidth` prüfen (Details in `CLAUDE.md`).
8. **shadcn-Doku** (`ui.shadcn.com`, `shadcn-vue.com`) ist nicht immer erreichbar – der lokale Komponentencode unter `app/components/ui/` ist die verlässliche Referenz für Varianten und Default-Klassen (`*/index.ts` enthält die `cva`-Varianten).

### 3.5 Illustrationen und Fotos

- **Rollen trennen:** Illustrationen = erzählende/atmosphärische Ebene (Hero, Leistungsübersichten, Leerzustände), Fotos = Beweis-Ebene (Produkte, Referenzen, Menschen, Räume). **Nicht im selben Raster mischen**; nebeneinander nur mit klarer Unterordnung der einen Bildart.
- **Multiply-Blend** (`mix-blend-multiply`) lässt Illustrationen mit hellem Hintergrund (Papier, Scan) mit der Fläche verschmelzen – **nur auf hellen Flächen**; auf dunklen verschwinden dunkle Linien. Dort Illustration weglassen oder auf eine helle Insel (`bg-card`) setzen.
- Voraussetzung: Der Bildhintergrund muss **reinweiß** sein. Gescannte/generierte „weiße" Hintergründe liegen meist bei #F5–#FA – Multiply hinterlässt dann ein sichtbares, wenige Prozent dunkleres Rechteck. Deshalb Hintergrund messen (2.2) und Assets einmalig aufbereiten (Weißpunkt anheben, Ränder trimmen, WebP/PNG exportieren). Notbehelf per CSS: `brightness-105 contrast-105` – hellt auch die Farben auf und entfernt farbstichige Hintergründe nicht vollständig. Auf getönten Flächen nehmen weiße Bildteile den Flächenton an (gewollt oder nicht – vorher entscheiden).
- Illustrationen nicht beschneiden (`object-contain`), nicht über ihre native Auflösung / 2 hinaus darstellen, dekorative mit `alt=""`.
- **Fotos:** Seitenverhältnisse **vereinheitlichen** und im Konzept pro Kontext festlegen (Karte, Galerie, Text+Bild, Detail). Stand der Prüfung sind sie uneinheitlich: `Gallery.vue` 4:5, `TextMedia.vue` 4:3, `ProductCard.vue` 4:3, Detailseite 1:1, `Cards.vue` quadratisch 128 px. Immer `AspectRatio` + `object-cover`, `width`/`height`, `loading="lazy"` unterhalb des ersten Screens, Directus-Transformationen über `getAssetSrc(file, { width, … })`, Alt-Texte über `imageAlt()` (`app/utils/product.ts`).
- Uploads per Skript brauchen einen MIME-Type (`ensureFile`), sonst greifen die Transformationen nicht (siehe `CLAUDE.md`).
- Einheitliche Bildstimmung (Licht, Hintergrund, Sättigung) ist wichtiger als das einzelne schöne Bild.

---

## 4. Vorlage „Projekt-Designkonzept"

Als eigene Datei im Projekt anlegen und ausfüllen. Ein ausgefülltes Beispiel ist `docs/design-konzept-blumenhaus.md` auf dem Branch `design` (gestylte Demo „Blumenhaus Hibiskus“, Aquarell-Illustrationen) – auf `main` bewusst nicht enthalten, damit der Starter neutral bleibt. **Es ist ein Beispiel für das Vorgehen, keine Stilvorlage:** Leitidee, Palette, Schriften und Formen dort sind aus genau dieser Marke und Bildwelt abgeleitet – ein neues Projekt leitet seine eigenen ab und soll am Ende anders aussehen. Im neuen Projekt die Datei durch das eigene Konzept ersetzen.

```markdown
# Designkonzept <Projekt>

## 1 Leitidee
<2–3 Sätze: Metapher/Haltung aus der Welt des Gegenstands. Die eine Signatur. Bewusste Abgrenzung von Reflex-Looks und Branchenklischee.>

## 2 Farbableitung
<Tabelle: Quelle (Asset, Messpunkt) · Hex · OKLCH · wird zu Token. Verteilung 60/30/10: was ist Grundfläche, was Stütze, wo – und nur wo – erscheint die Aktionsfarbe.>

## 3 Token-Palette mit Kontrastnachweis
<Vollständiger :root-Block für tailwind.css (alle shadcn-Variablen, --radius, ggf. Projekt-Tokens + @theme-inline-Registrierung), Hex als Kommentar, Gamut geprüft.>
<Tabelle geprüfter Paare mit Verhältnis und Anforderung (Pflicht-Paare aus der Methode). Liste der durchgefallenen = verbotenen Kombinationen. .dark-Block mit Hauptpaaren.>

## 4 Typografie
<Paarung mit Begründung aus Gegenstand/Bildwelt, Rollenregel (welche Schrift wo), Achsen/Features. Einbindung (@fontsource-Pakete, Importe, --font-sans/--font-heading, Base-Stile).>
<Rollentabelle auf --text-f-*: Rolle · Klasse · px-Bereich · Schrift/Gewicht · Zeilenhöhe · Laufweite. Maximalbreiten. Test der längsten Wörter bei 360 px. Rich-Text-Stile.>

## 5 Raum, Raster, Rhythmus
<Container, feste Abstandswerte je Ebene auf --spacing-f-*, paddingBottom-Regel, Raster/Spaltenverhältnisse, Breakpoints, Abfolge der Kompositionsmuster.>

## 6 Flächen
<Mapping der vier BlockSection-Keys (Klassen, CMS-Labels), Rolle jeder Fläche, Regeln für Wechsel, Umgang mit der dunklen/kräftigen Fläche inkl. mutedClass, Ring/Border-Scope, Verhalten von Cards je Fläche.>

## 7 Bildwelt
<Rollen von Illustration/Foto/Icon, Blend-/Aufbereitungsregeln, Zuordnung Asset → Einsatzort, Seitenverhältnisse je Kontext, Auswahlkriterien für Fotos, Alt-Text-Regeln.>

## 8 Komponenten-Einsatz
<Button: welche Variante/Größe für welche Priorität, Beschriftungen, Verhalten auf dunkler Fläche. Card: Kante vs. Schatten, klickbar vs. statisch. Badge, Formular, Icons (Strichstärke, Größen), Radius-Zuordnung, Schatten-Tokens.>

## 9 Motion
<Die eine orchestrierte Bewegung (Klassen, Dauer, Staffelung, reduced-motion), erlaubte Zustandsübergänge, Negativliste.>

## 10 Sektion für Sektion
<Tabelle # · Sektion · Fläche · pb. Dann je Sektion/Seite: Komposition, Hierarchie, Komponenten+Varianten, Bildformat, mobil, Aktion. Auch Header, Footer, Unterseiten, 404/Leerzustände.>

## 11 Umsetzungsreihenfolge
<Typisch: 1 Fonts + Tokens + Schatten + Base-Typo in tailwind.css → 2 BlockSection-Mapping/mutedClass/Labels → 3 Assets aufbereiten → 4 BlockIntro, dann Blöcke der Reihe nach → 5 Flächen/pb im CMS bzw. Seed → 6 Screenshots Desktop + Mobile (CDP), Checkliste, Typecheck, Build.>

## 12 Offene Punkte / Annahmen
<Was geschätzt statt gemessen wurde, was visuell noch zu prüfen ist, Rückfallentscheidungen.>
```

---

## 5. Abnahme-Checkliste

**System**
- [ ] Die Seite ist nicht spontan als shadcn-Default erkennbar (eigene Handschrift in Farbe, Typo, Form, Komposition). Geänderte Dateien unter `app/components/ui/` sind im Projektkonzept aufgelistet; Fokus, Tastaturbedienung und ARIA der Komponenten funktionieren weiterhin.
- [ ] Keine Hex-/Arbitrary-Farben in Templates – nur Token-Klassen.
- [ ] Nur die im Konzept definierten Radien, Schattenstufen, Abstands- und Schriftgrößenrollen.
- [ ] Fonts selbst gehostet; kein Request an `fonts.googleapis.com` / `fonts.gstatic.com` (Network-Tab). Der Inter-Import des Starters ist entfernt.
- [ ] `yarn build` läuft, CSS vollständig (kein `@apply` auf Komponentenklassen in `@layer components`); Typecheck ohne neue Fehler.
- [ ] `.dark`-Block passt zur Palette.

**Hierarchie & Typografie**
- [ ] Blur-/Squint-Test je Sektion: ein dominantes Element, Lesereihenfolge klar.
- [ ] Genau eine `h1` pro Seite, keine übersprungenen Ebenen.
- [ ] Schriftrollen eingehalten (Display nur dort, wo das Konzept es vorsieht); pro Sektion ≤ 3 Schriftgrößen.
- [ ] Fließtext ≥ 16 px; Lesezeilen 45–75 Zeichen; Zeilenhöhen nach Rollentabelle.
- [ ] Längste Headline-Wörter brechen bei 360 px sauber (Trennung korrekt, kein Überlauf).
- [ ] Typografische Anführungszeichen, Halbgeviertstriche, geschützte Leerzeichen vor Einheiten.

**Farbe & Fläche**
- [ ] Aktionsfarbe nur an Aktionen (und ausdrücklich erlaubten Stellen); pro Viewport ≤ 1 gefüllter Primär-Button.
- [ ] Alle Pflicht-Paare gerechnet und dokumentiert; Stichproben im Browser (DevTools): Sekundärtext auf jeder Fläche, Links auf getönten Flächen, Text auf dunkler Fläche, Badges auf Fotos, Hilfetexte/Placeholder, Button-Hover.
- [ ] Kein ungeprüfter Opacity-Text; verbotene Kombinationen kommen nicht vor.
- [ ] Flächenfolge wie im Konzept; kräftige/dunkle Fläche nicht benachbart zu gleichfarbigem Footer.
- [ ] `paddingBottom` nach Geometrie-Regel → alle Sektionsabstände optisch gleich, kein Inhalt klebt an einer Farbkante, kein doppelter Leerraum.
- [ ] Fehlerfarbe von Aktionsfarbe unterscheidbar; Fehler nie nur über Farbe.

**Bilder**
- [ ] Multiply-Bilder: kein Kasten/Helligkeitssprung sichtbar (auch bei 200 % Zoom und auf getönten Flächen); keine auf dunklen Flächen.
- [ ] Illustrationen und Fotos nicht im selben Raster; Illustrationen unbeschnitten.
- [ ] Seitenverhältnisse je Kontext einheitlich; `width`/`height` gesetzt, kein Layout-Shift; Lazy-Loading unterhalb des ersten Screens.
- [ ] Alt-Texte: dekorativ `alt=""`, inhaltlich beschreibend.

**Komponenten & Interaktion**
- [ ] Button-Beschriftungen konsistent (gleiche Aktion = gleicher Name); Haupt-CTAs ≥ 44 px hoch; alle Ziele ≥ 24 px.
- [ ] Auf dunklen/kräftigen Flächen: Outline-Buttons und Carousel-Pfeile lesbar (nicht hell auf hell); Hauptaktion hebt sich als Form ab.
- [ ] Karten: Kante *oder* Schatten; nirgends Karte in Karte; nur echte Objekte sind Karten.
- [ ] Tab-Reihenfolge logisch; Fokus auf *jeder* Fläche sichtbar (hell, getönt, dunkel, Footer).
- [ ] Karussell: kein Autoplay, Pfeile innerhalb und per Tastatur bedienbar, Folgeelement angeschnitten, Position erkennbar, kein mobiler Überlauf.
- [ ] Formular: Labels sichtbar, kein Placeholder-als-Label, Fehler mit Text + Icon am Feld, Eingaben bleiben erhalten, Erfolg eindeutig, Inputs mobil ≥ 16 px Schrift.
- [ ] `tel:`/`mailto:`-Links funktionieren; primäre Kontaktmöglichkeit mobil mit einem Tap erreichbar.

**Motion**
- [ ] Nur die definierte Einstiegsbewegung + Zustandsübergänge (≤ 300 ms, ease-out).
- [ ] Mit „Bewegung reduzieren" keine dekorative Animation; Inhalte sofort sichtbar – auch ohne JavaScript.

**Responsiv**
- [ ] 360 / 768 / 1280 / 1536 px: `document.documentElement.scrollWidth == clientWidth` (Mobile per CDP-Emulation).
- [ ] Gemeinsame linke Kante von Header, Sektionsköpfen, Rastern, Footer.
- [ ] Erster Screen zeigt Versprechen + Aktion und signalisiert, dass es weitergeht.

**Inhalt & Vertrauen**
- [ ] Kontaktdaten, Zeiten, Preise/Preisrahmen, Bedingungen offen sichtbar.
- [ ] Social Proof mit Quelle; keine erfundenen oder schwachen Zahlen.
- [ ] Texte konkret, aktiv, ohne Floskel-Claims; keine Tippfehler, keine toten Links.
- [ ] Vor Livegang: `SITE_URL`, `public/open-graph.png`, Favicon (siehe `CLAUDE.md`).

**Anti-Template-Gegenprobe (1.8)**
- [ ] Kein zentrierter Schwebe-Hero, keine Verläufe/Glas/Glow, keine Icon-Kacheln, keine Deko-Nummern, keine informationslosen Eyebrows/Badges.
- [ ] Keine zwei identischen Kompositionsmuster hintereinander; max. ein 3er-Karten-Raster pro Seite.
- [ ] Leitidee und Signatur sind auf der Seite erkennbar – und nur an *einer* Stelle laut.
- [ ] Letzter Schritt: ein Element entfernen, das keine Aufgabe hat.

---

## 6. Quellen

Abgerufen und ausgewertet (September 2026):

- [RUI] Refactoring UI (Wathan/Schoger): https://www.refactoringui.com/ · Notizen zum Buch (abgerufen): https://github.com/tigerabrodi/refactoring-ui-notes · weitere Zusammenfassung (nur als Suchtreffer-Auszug gelesen): https://www.sglavoie.com/posts/2023/09/09/book-summary-refactoring-ui/ · Artikel „7 Practical Tips for Cheating at Design" (beim Abruf 403, Inhalt deckt sich mit dem Buch): https://medium.com/refactoring-ui/7-practical-tips-for-cheating-at-design-40c736799886
- [RUI-COLOR] Building Your Color Palette: https://www.refactoringui.com/previews/building-your-color-palette
- [NNG-VD] 5 Principles of Visual Design in UX: https://www.nngroup.com/articles/principles-visual-design/
- [NNG-PROX] Proximity Principle: https://www.nngroup.com/articles/gestalt-proximity/
- [NNG-F] F-Shaped Pattern of Reading: https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- [NNG-SCROLL] Scrolling and Attention: https://www.nngroup.com/articles/scrolling-and-attention/
- [NNG-TRUST] Trustworthiness in Web Design – 4 Credibility Factors: https://www.nngroup.com/articles/trustworthy-design/
- [NNG-FORM] Website Forms Usability – Top 10 Recommendations: https://www.nngroup.com/articles/web-form-design/
- [NNG-CAR] Designing Effective Carousels: https://www.nngroup.com/articles/designing-effective-carousels/
- [NNG-ACC] Accordions on Desktop: https://www.nngroup.com/articles/accordions-on-desktop/
- [NNG-ANIM] Executing UX Animations – Duration and Motion: https://www.nngroup.com/articles/animation-duration/
- [NNG-SP] Social Proof in UX: https://www.nngroup.com/articles/social-proof-ux/
- [LoUX] Laws of UX (Jon Yablonski): https://lawsofux.com/
- [BUT] Butterick's Practical Typography: https://practicaltypography.com/summary-of-key-rules.html · https://practicaltypography.com/typography-in-ten-minutes.html
- [WD-TYPO] web.dev Learn Design – Typography: https://web.dev/learn/design/typography
- [WD-PRM] web.dev – prefers-reduced-motion: https://web.dev/articles/prefers-reduced-motion
- [EL] Every Layout – Axioms: https://every-layout.dev/rudiments/axioms/
- [BAY] Baymard – Line Length Readability: https://baymard.com/blog/line-length-readability
- [EM] Evil Martians – OKLCH in CSS: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl · Picker mit Gamut-Anzeige: https://oklch.com
- [WCAG-143] Understanding 1.4.3 Contrast (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- [WCAG-1411] Understanding 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html (über 1.4.3 referenziert, Seite selbst nicht abgerufen)
- [WCAG-258] Understanding 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- [SHAD] shadcn/ui Theming (Token-Paare, Zweck der Tokens, neue Tokens über `@theme inline`, Base-Colors, Radius-Skala): https://ui.shadcn.com/docs/theming
- [TW] Tailwind CSS v4 – Theme-Variablen / Box-Shadow: https://tailwindcss.com/docs/theme · https://tailwindcss.com/docs/box-shadow (Default-Schattenwerte abgerufen; Überschreiben per `@theme { --shadow-*: … }` aus Kenntnis der v4-Doku)
- [IMP] Impeccable – Katalog von Design-Tells: https://impeccable.style/slop/
- [925] AI Slop Design Tells: https://www.925studios.co/blog/ai-slop-design-tells
- [LGM] LG München I, 20.01.2022, 3 O 17493/20: https://dejure.org/dienste/vernetzung/rechtsprechung?Text=3+O+17493/20 · Einordnung: https://www.dr-datenschutz.de/schadensersatz-urteil-google-fonts-und-die-dsgvo/
- Fontsource (selbst gehostete Fonts als npm-Pakete): https://fontsource.org/ · Paketprüfung: `https://registry.npmjs.org/@fontsource-variable/<name>/latest`
- OKLab/OKLCH-Matrizen (Skript 2.3): Björn Ottosson, https://bottosson.github.io/posts/oklab/ (aus Vorwissen, Werte gegen bekannte Hex-Farben gegengeprüft)

Nicht abgerufen, aus Vorwissen (als solches behandeln): Apple Human Interface Guidelines (44-pt-Ziele), Material Design 3 Motion (Dauer-/Easing-Tokens; die Seite ist JS-gerendert und lieferte keinen Inhalt), APCA als Kontrastmodell, 60-30-10-Regel, iOS-Zoom bei Inputs < 16 px.

Bewusst nicht verwendet: Conversion-Prozentwerte aus Marketing-/Agentur-Blogs zu lokalen Landing Pages (keine nachvollziehbare Methodik).
