# Landingpage (statisch)

Zwei Varianten als einzelne HTML-Dateien mit eingebetteten Screenshots, zum Verschicken oder Öffnen im Browser:

- `pflege-jobs-landingpage-v1.html`: ruhig, Abschnitte mit Haarlinien, Screenshots gerahmt
- `pflege-jobs-landingpage-v2.html`: kräftig, große Typografie, gestapelte Screenshots, Lauftext mit Chips

Quellen unter `src/v1` und `src/v2`, Bilder unter `src/img` (aus dem Produktions-Build ohne Dev-Werkzeuge und ohne Demo-Balken, Demo-Dienst in Tiefgrün/Mint). Neu bauen:

```
node docs/landingpage/src/inline.mjs v1
node docs/landingpage/src/inline.mjs v2
```

Später wird die gewählte Variante nach Nuxt übernommen und unter der Produkt-Domain ausgeliefert.

## Quellen der Vergleichszahlen (Stand Oktober 2026)

- Stepstone Pro-Anzeige 30 Tage ab 1.449 € netto: https://www.personalturm.de/blog/stepstone-kosten , https://sprad.io/de/blog/stepstone-kosten-preise
- Personalvermittlung Pflege 20–35 % des Bruttojahresgehalts, ab ca. 5.000 €: https://hiral.de/ratgeber/personalsuche/personalvermittlung-pflegeberufe , https://fachpower.de/magazin/kosten-personalvermittlung/
- Social Recruiting Agentur 1.500–3.500 €/Monat Betreuung plus 1.000–3.000 € Werbebudget: https://webtak.de/social-recruiting/kosten/ , https://fachkraft-jetzt.de/magazin/recruiting-kosten-2026/
- Zeitarbeit: kein belastbarer Aufschlag belegt, Zeile entfernt.
