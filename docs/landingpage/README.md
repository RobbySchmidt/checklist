# Landingpage (statisch)

`pflege-jobs-landingpage.html` ist eine einzelne Datei mit eingebetteten Screenshots, zum Verschicken per Mail oder Öffnen im Browser.

Quelle: `src/landingpage.template.html` (verweist auf `src/img/*.png`). Neu bauen nach Änderungen:

```
node docs/landingpage/src/inline.mjs docs/landingpage/pflege-jobs-landingpage.html
```

Screenshots stammen aus dem laufenden Prototyp (Demo-Dienst in Tiefgrün/Mint). Später wird die Seite nach Nuxt übernommen und unter der Produkt-Domain ausgeliefert.
