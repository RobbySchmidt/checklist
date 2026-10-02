# Designkonzept Stellenseite

- **Zielgruppe:** Pflegekräfte am Handy, in der Pause. Mobile-first, große Tippflächen (min. 48 px), Gehalt und Dienstplan typografisch hervorgehoben.
- **Tokens:** `--primary` aus `employer.color_primary` (Fallback `oklch(0.45 0.08 165)`), `--secondary` aus `color_secondary` (Fallback `oklch(0.95 0.02 165)`), Neutrale leicht grünstichig. Kontraste: Primärfarbe als Fläche mit weißer Schrift, Text auf Papier aus `--foreground`.
- **Schrift:** Inter aus dem Base-Repo bleibt (bereits geladen). Überschriften 700, Fließtext 400, Chips 600 in 0.85rem.
- **Formular:** ein Feld pro Zeile, Labels über dem Feld, Fehler inline unter dem Feld in `--destructive`.
- **Bewegung:** Kein Hover-Lift, keine Animationen außer Fokus-Ring.

## Portal

- **Ton:** Werkzeug, kein Schaufenster. Neutrale Farben (`--background`, `--foreground`, `--muted`, `--border`), Akzent nur für Hauptaktion und Status.
- **Darstellung:** Listen (Stellen, Bewerbungen) als Tabellen mit klaren Spalten und Statuschips; auf dem Handy werden Zeilen zu gestapelten Karten.
- **Formulare:** einspaltig, Labels über dem Feld, Fehler inline unter dem Feld in `--destructive`, Speichern-Hinweis direkt am Button.
- **Tippflächen:** große Tippflächen (min. 48 px) für Buttons, Statuswechsel und Zeilen, damit das Portal auch am Handy bedienbar bleibt.
- **Bewegung:** wie auf der Stellenseite, keine Animationen außer Fokus-Ring.
