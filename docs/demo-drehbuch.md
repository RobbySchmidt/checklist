# Demo-Drehbuch: schichtstark in fünf Minuten

Für eine Bildschirmaufnahme oder ein Gespräch. Vorher: Docker läuft, `yarn dev`, Browser mit zwei Tabs (öffentliche Seite und Portal). Demo-Dienst ist „Pflegedienst Sonnenhof Leipzig“, Login im Portal mit `pdl@sonnenhof.example` und dem gesetzten Passwort oder per Anmeldelink.

Wenn eine Testbewerbung „Anna Beispiel“ noch in der Rückruf-Liste liegt, vorher im Portal auf „Zusage“ setzen, damit die Demo mit einer leeren Liste beginnt.

## 0:00 Das Problem, ein Satz

> „Pflegedienste geben tausende Euro für Vermittler aus, dabei steht ihre Stelle nicht einmal in der Google-Stellenansicht. Ihre Website kann das nicht. Unsere kann es, und die Bewerbung dauert eine Minute.“

## 0:20 Die Google-Stellenansicht

Tab: `/jobs/pflegefachkraft/google-vorschau`

- Auf die gelbe Leiste zeigen: „Das ist ein Nachbau, keine echte Google-Seite. Wie es bei Google aussieht, wenn es klappt.“
- Auf den eigenen Eintrag zeigen: Gehalt steht drin, Vollzeit und Teilzeit, direkter Bewerben-Knopf.
- Satz: „Daneben stehen sonst nur Portale und Zeitarbeit. Der Dienst selbst fehlt dort heute.“
- Klick auf „Bewerben auf Pflegedienst Sonnenhof Leipzig“.

## 1:00 Die Stellenseite

Tab: `/jobs/pflegefachkraft`, Browserfenster schmal ziehen oder Handy-Ansicht der Entwicklerwerkzeuge.

- Gehalt und Dienstplan stehen vor dem Formular: „Das sind die zwei Dinge, die eine Pflegekraft wissen will, bevor sie klickt.“
- Nach unten zum Formular: vier Felder, kein Lebenslauf.
- Live ausfüllen: Name „Maria Muster“, Telefon „0151 1234567“, Qualifikation „Pflegefachkraft“, Wunschstunden „Teilzeit ca. 30 h“, Haken, „Rückruf anfordern“.
- Bestätigung zeigen: „Sonnenhof meldet sich innerhalb von 24 Stunden.“
- Nach oben scrollen, Teilen-Bereich zeigen: WhatsApp-Knopf, QR-Code, Aushang. Satz: „Die Pflegedienstleitung schickt das einmal in die Team-Gruppe. Empfehlungen sind in der Pflege der beste Kanal.“

## 2:30 Die Mail beim Dienst

Mailprogramm: die Benachrichtigung „Neue Bewerbung: Pflegefachkraft (m/w/d) – Maria Muster“ öffnen (geht an die Adresse aus `DEMO_EMAIL`).

- Vier Angaben, Quelle, großer Rückruf-Knopf.
- Satz: „Hier verlieren Pflegedienste heute die meisten Bewerber: Es ruft niemand zurück. Deshalb erinnert das System nach 24 Stunden.“

## 3:00 Das Portal

Tab: `/portal`

- Übersicht: Kennzahlen des Monats, darunter „Wen muss ich heute anrufen?“ mit Maria Muster und „wartet seit 1 Min.“.
- Klick auf „Anrufen“ (zeigt den Wähl-Link), dann „Kontaktiert“: der Eintrag verschwindet aus der Liste.
- Bewerbungen: Stand „Kontaktiert“ wählen, Eintrag aufklappen, „Einladung“ klicken: fertige Nachricht, per WhatsApp oder E-Mail. Satz: „Der Dienst versendet selbst. Wir verschicken nichts an Bewerber.“
- Stellen: Tabelle mit Aufrufen und Bewerbungen, „Neue Stelle“ kurz öffnen, auf die Markup-Prüfung rechts zeigen: „Das Portal sagt dem Dienst, was Google braucht, bevor er veröffentlicht.“
- Profil: Farbwähler, Vorschau des Bewerben-Knopfs. Eine Voreinstellung antippen, speichern, Stellenseite neu laden: die Farbe ist da.

## 4:30 Der Beleg und die Grenze

- Screenshot des Google-Tests zeigen: „Stellenausschreibungen: 1 gültiges Element.“
- Satz: „Ob und wann Google eine Stelle aufnimmt, entscheidet Google. Wir stellen sicher, dass die Voraussetzungen stimmen, und wir melden Stellen an und ab.“

## 4:50 Was fehlt, was es kostet

- Offen: Livegang mit Hosting und Domain, Arbeitgeberseite, Träger mit mehreren Einrichtungen.
- Angebot: 2.000 Euro einmalig, 149 Euro im Monat. Eine gesparte Vermittlungsprovision zahlt das erste Jahr doppelt.
- Schluss: „Erster Pilot: die AWO, eine Stelle, vier Wochen, kostenlos.“

## Nach der Aufnahme

- Testbewerbung „Maria Muster“ im Portal auf „Absage“ setzen oder in Directus löschen.
- Farbe im Profil auf Tiefgrün zurücksetzen, falls geändert.
