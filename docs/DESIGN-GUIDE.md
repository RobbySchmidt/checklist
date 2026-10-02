# Design-Guide

Was bei diesem Projekt wichtig war – Prinzipien, Fehler und Lösungen, die sich auf jedes andere Projekt übertragen lassen.

## Inhalt

1. [Weniger ist mehr](#01-weniger-ist-mehr)
2. [Hierarchie](#02-hierarchie)
3. [Schriftgrößen & Typografie](#03-schriftgrößen--typografie)
4. [Abstände](#04-abstände)
5. [Ausrichtung & Layout](#05-ausrichtung--layout)
6. [Farbe](#06-farbe)
7. [Konsistenz](#07-konsistenz)
8. [Arbeiten auf Weiß](#08-arbeiten-auf-weiß)
9. [Technik](#09-technik)
10. [Figma](#10-figma)
11. [Kurz-Checkliste](#kurz-checkliste)

---

## 01 Weniger ist mehr

Gutes Design entsteht selten durch mehr Elemente, sondern durch wenige, bewusste Entscheidungen. Die Wirkung kommt aus Abständen, Schriftgrößen und gezielten Akzenten.

### Regeln

- Bevor du etwas hinzufügst, frag dich: Löst es ein Problem? Wenn nicht, lass es weg.
- Wenn etwas nicht stimmt, versuch es zuerst mit Weglassen statt mit Hinzufügen.
- Erst übertreiben und dann reduzieren ist ein legitimer Weg. Mit der Zeit startest du automatisch reduzierter.
- Konsistenz schlägt Kreativität: lieber ein Effekt, der überall gleich ist, als fünf verschiedene.

### Aus dem Projekt

- Der Pfeil, der beim Hover nach rechts rutscht, zeigt „klickbar“ – er löst ein Problem und darf bleiben. `group-hover:translate-x-1`
- Ein zusätzlicher Schatten auf einer farbigen Kachel trennt nichts, was nicht schon getrennt ist – er darf weg.
- Im FAQ reichen Linien statt Boxen. So wird es der ruhige Abschnitt der Seite, statt eine weitere Wand aus Flächen.

---

## 02 Hierarchie

Frag dich bei jedem Element: Wie wichtig ist das? Wichtiges wird groß, kräftig und kontrastreich – Unwichtiges kleiner, heller oder transparenter.

### Regeln

- Die Überschrift ist immer die größte Schrift in ihrem Block.
- Nebeninfos über Transparenz zurücknehmen statt über neue Farben. `opacity-75`
- Der Blick braucht einen klaren Weg: Überschrift → Text → Aktion.
- Die Aktion (Button) bekommt den einzigen Farbakzent im Block.

### Aus dem Projekt

- (m/w/d) war genauso groß wie der Jobtitel und wirkte dadurch fast gleich wichtig. Kleiner und leicht transparent tritt es zurück. `text-xl opacity-75`
- Im Banner stand die Überschrift außerhalb der Box, der Fließtext darin war groß – die Hierarchie war verdreht. Lösung: Überschrift in die Box, Text kleiner.
- Bei den Team-Karten ist der Name die Hauptsache, die Rolle tritt zurück. `opacity-75`

---

## 03 Schriftgrößen & Typografie

Wenige Größen mit klaren Sprüngen wirken ruhiger und professioneller als viele ähnliche Größen.

### Regeln

- 3–4 Schriftgrößen pro Seite reichen. Große Sprünge zwischen den Stufen wirken klarer als viele kleine.
- Große Überschriften eng setzen, sonst fällt der Block auseinander. `leading-tight`
- Neben einer sehr großen Überschrift wirkt zu kleiner Fließtext verloren – der Sprung darf nicht zu groß sein.
- Gleiche Elemente bekommen gleiche Klassen: Alle Abschnitts-Überschriften sind identisch. `font-medium text-f-4xl`
- Fluid Font Sizes wachsen mit der Bildschirmbreite mit. `text-f-*`
- Eine eigene Schrift statt Systemschrift – die Systemschrift sieht auf jedem Gerät anders aus.
- Zwei Schriftstärken reichen meistens: normal und medium.

### Aus dem Projekt

- Im Hero war zwischen den Zeilen der Überschrift viel Luft, zwischen Überschrift und Text kaum. Mit engem Zeilenabstand und etwas Abstand zum Text wurde ein kompakter Block daraus. `leading-tight + space-y-4`
- Der Hero-Text war mit text-lg zu klein neben der großen Überschrift – eine Stufe größer war ausgewogener. `text-xl`
- Fraunces als Serif für Überschriften wurde ausprobiert und wieder verworfen. Ausprobieren gehört dazu – mit einer Variable ist der Wechsel eine Zeile. `--font-serif`

---

## 04 Abstände

Abstände zeigen, was zusammengehört. Sie sind das wichtigste Werkzeug, um Ordnung zu schaffen – ganz ohne Linien oder Boxen.

### Regeln

- Was zusammengehört, steht eng beieinander. Zwischen Gruppen kommt mehr Luft.
- Eine Aktion bekommt mehr Abstand als die Texte untereinander – so wirkt sie wie ein eigener Schritt.
- Abstände nie doppelt vergeben: gap und space-y gleichzeitig addieren sich. `gap-6 statt gap-6 space-y-6`
- Steht ein Element zwischen zwei Linien, oben und unten gleich viel Abstand geben.
- Bei Animationen mit overflow-hidden das Padding ans innere Element hängen, nicht an den animierten Container.
- Boxen nicht größer machen, als ihr Inhalt es braucht.

### Aus dem Projekt

- Im Accordion addierten sich space-y-3 an der Liste und py-3 am Button: oben 12px, unten 24px. Nur py-3 am Button plus pb-3 am Text ist symmetrisch.
- Die Team-Liste hatte gap-6 und space-y-6 – die Reihenabstände wurden ungleichmäßig.
- Im Banner war p-20 zu viel Innenabstand, die Box wirkte schwer und leer. `p-20 → p-16`
- Hero: Überschrift → Text 16px, Text → Button 48px. `space-y-4 + mt-12`

---

## 05 Ausrichtung & Layout

Elemente, die aufeinander folgen oder sich wiederholen, liegen auf einer gemeinsamen Linie. Das Auge merkt jede Abweichung.

### Regeln

- Eine gemeinsame Content-Linie für alle Abschnitte. `max-w-6xl mx-auto px-4`
- Auch Sonderlayouts – etwa ein Bild bis zum Bildschirmrand – richten den Text an der Content-Linie aus.
- In Kachel-Reihen gleiche Elemente auf gleiche Höhe bringen. `h-full flex flex-col + mt-auto`
- Eine linksbündige Seite bleibt linksbündig – ein zentrierter Ausreißer wirkt zufällig.
- Leere Fläche ist in Ordnung, wenn sie gewollt aussieht.

### Aus dem Projekt

- Hero mit 4-Spalten-Grid: Der Text startet auf der Content-Linie, das Bild läuft bis zum Rand. `grid-cols-[1fr_minmax(0,36rem)_minmax(0,36rem)_1fr]`
- „mehr erfahren“ sitzt in jeder Job-Kachel unten, egal wie lang der Titel ist.
- Der Banner bleibt linksbündig wie der Rest der Seite, obwohl rechts Platz frei ist.

---

## 06 Farbe

Wenige Farben, als Variablen angelegt und konsequent eingesetzt. Farbe lenkt Aufmerksamkeit – sie ist Werkzeug, nicht Dekoration.

### Regeln

- Farben als Variablen anlegen – dann änderst du das ganze Design an einer Stelle. `--color-primary`
- Eine Akzentfarbe, sparsam eingesetzt, vor allem für Aktionen wie Buttons und Links.
- Hell und dunkel im Wechsel gibt der Seite Rhythmus und trennt Abschnitte ganz ohne Linien.
- Kein reines Weiß und kein reines Schwarz – leicht getönt wirkt hochwertiger.
- Alle Farben einer Palette haben dieselbe Temperatur: warm zu warm, kühl zu kühl.
- Kontrast prüfen: Text muss auf jedem Hintergrund gut lesbar bleiben – auch im Hover.
- Nicht zwei gleiche Akzentflächen direkt untereinander.

### Aus dem Projekt

- Rhythmus der Seite: Hero dunkel → Jobs hell → Team dunkel → FAQ hell → Footer dunkel.
- Nach dem Wechsel auf die warme Braun-Palette wirkte das neutrale Grau zu kühl – es wurde leicht wärmer. `#ebebea → #eeebe7`
- Braun auf fast schwarzem Grund hat nur etwa 2:1 Kontrast – als Hover-Farbe in der Navigation kaum lesbar.
- Kein farbiger Button in der Navigation, weil direkt darunter schon der Hero-Button sitzt.

---

## 07 Konsistenz

Ein Design wirkt professionell, wenn es wenigen Regeln folgt und diese überall durchzieht. Gleiche Aktion, gleiches Aussehen.

### Regeln

- Gleiche Aktionen sehen gleich aus: gleiche Schriftstärke, gleicher Hover.
- Ein Radius für alles, als Variable. `rounded-main`
- Bewusste Stil-Entscheidungen konsequent durchziehen – dann werden sie zum Merkmal statt zum Zufall.
- Rechtschreibung gehört dazu: Buttons am Satzanfang großschreiben, Verben klein.
- Bei Unsicherheit fragen: Warum habe ich das ursprünglich so gemacht? Gab es einen guten Grund, dabei bleiben.

### Aus dem Projekt

- 2px-Linien statt 1px – bewusst gewählt, weil es mehr Charakter hat. Dann aber überall 2px. `border-2`
- font-medium am Hero-Button wurde entfernt und wieder hinzugefügt – weil „mehr erfahren“ dieselbe Aktion ist und auch medium hat.
- Überschriften mit text-4xl statt text-f-4xl wurden angeglichen.

---

## 08 Arbeiten auf Weiß

Ohne Farbe muss alles über Schrift, Abstände und Ausrichtung funktionieren – deshalb sieht man dort jeden Fehler sofort. Typisch bei seriösen Kunden wie einer Arztpraxis.

### Regeln

- Hierarchie über 3–4 feste Grautöne: Überschrift, Fließtext, Nebeninfo, Linien und Flächen.
- Leicht getöntes Weiß statt reinem Weiß.
- Bereiche über Abstand, sehr hellgraue Flächen oder feine Linien trennen statt über farbige Boxen.
- Eine Akzentfarbe nur für Buttons und Links – dann zieht sie den Blick genau dorthin.
- Die Schrift trägt das Design, echte Fotos bringen die Wärme.
- Bei Arzt & Co.: Vertrauen vor Kreativität. Größere Schrift, guter Kontrast, das Wichtigste sofort sichtbar – Telefon, Öffnungszeiten, Termin, Anfahrt.

### Übung

- Gestalte eine Seite zuerst komplett in Schwarz, Weiß und Grau.
- Wenn sie so schon klar gegliedert ist und funktioniert, kommt die Akzentfarbe ganz zum Schluss dazu.
- Dabei merkst du, wie wenig Farbe du eigentlich brauchst.

---

## 09 Technik

Kleine Dinge im Code, die leicht übersehen werden.

### Regeln

- :key gehört auf das Element mit dem v-for. `<li v-for="…" :key="item.id">`
- Listen als Array-Prop, einzelne Datensätze als Object. `items: Array / data: Object`
- Eine ID darf pro Seite nur einmal vorkommen – beim Kopieren von Komponenten prüfen.
- Sprünge zu Abschnitten sind Links, keine Buttons – aussehen dürfen sie wie Buttons. `<NuxtLink to="/#stellenangebote">`
- Bei sticky Navigation einen Scroll-Abstand setzen, sonst verdeckt sie die Überschriften. `scroll-pt-20`
- Telefon und E-Mail klickbar machen. `tel: / mailto:`

### Gut zu wissen

- Accordion: echter `<button>` mit aria-expanded und aria-controls, geschlossene Inhalte per inert sperren.
- Auf- und Zuklappen ohne bekannte Höhe animieren. `grid-rows-[0fr] → grid-rows-[1fr]`
- Schriften mit @nuxt/fonts lokal ausliefern – Google Fonts direkt von Google zu laden ist in Deutschland datenschutzrechtlich problematisch.
- Nicht alle Icons auf einmal importieren – nuxt-lucide-icons lädt nur die genutzten. `<LucideArrowRight />`

---

## 10 Figma

Figma folgt denselben Prinzipien wie der Code. Wer Tailwind kann, kann Auto Layout.

### Regeln

- Zuerst das Fundament: Variables für Farben und Radius, Text Styles für Schriften.
- Variables statt Color Styles – sie können auch Zahlen speichern, etwa Radius und Abstände.
- Kostenloser Plan: beliebig viele Variablen, aber nur ein Mode und drei Dateien.
- Von innen nach außen bauen: Elemente markieren, Shift + A packt sie in ein Auto Layout.
- „Fill container“ gibt es nur innerhalb eines Auto Layouts.
- Container wie im Code: Fill container, Max width 1152, Padding 16 – außen mittig ausrichten.
- Texte auf Auto height und Rahmen auf Hug, sonst überlappen längere Inhalte.
- Varianten über Ebenennamen anlegen. `Color=primary, State=hover`
- Der Layout Guide zeigt die Content-Linie nur an – er schiebt nichts dorthin.
- Icons über das offizielle Plugin „Lucide Icons“. Einfärben über Stroke, nicht Fill.

### Tailwind → Figma

| Figma | Tailwind |
|---|---|
| Auto Layout mit Gap | `flex, gap-*` |
| Auto Layout vertikal | `space-y-*` |
| Padding im Auto Layout | `p-*, px-*, py-*` |
| Grid-Flow oder horizontal mit Wrap | `grid-cols-*` |
| Fill container | `w-full` |
| Hug contents | `w-fit` |
| Gap „Auto“ | `justify-between` |
| Max width | `max-w-*` |
| Variante der Komponente | `hover:` |

---

## Kurz-Checkliste

Vor dem Abschluss eines Designs einmal durchgehen.

- [ ] Ist sofort klar, was das Wichtigste auf der Seite ist?
- [ ] Liegen alle Abschnitte auf derselben Content-Linie?
- [ ] Höchstens 3–4 Schriftgrößen – und alle Überschriften gleich?
- [ ] Abstände eng innerhalb, weit zwischen Gruppen – nichts doppelt?
- [ ] Eine Akzentfarbe, vor allem für Aktionen?
- [ ] Sehen gleiche Aktionen überall gleich aus?
- [ ] Ist Text auf jedem Hintergrund gut lesbar – auch im Hover?
- [ ] Gibt es etwas, das ich weglassen könnte?
