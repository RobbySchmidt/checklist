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
