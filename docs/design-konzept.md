# Designkonzept Stellenseite

- **Zielgruppe:** Pflegekräfte am Handy, in der Pause. Mobile-first, große Tippflächen (min. 48 px), Gehalt und Dienstplan typografisch hervorgehoben.
- **Tokens:** `--primary` aus `employer.color_primary` (Fallback `oklch(0.45 0.08 165)`), `--secondary` aus `color_secondary` (Fallback `oklch(0.95 0.02 165)`), Neutrale leicht grünstichig. Kontraste: Primärfarbe als Fläche mit weißer Schrift, Text auf Papier aus `--foreground`.
- **Schrift:** Inter aus dem Base-Repo bleibt (bereits geladen). Überschriften 700, Fließtext 400, Chips 600 in 0.85rem.
- **Formular:** ein Feld pro Zeile, Labels über dem Feld, Fehler inline unter dem Feld in `--destructive`.
- **Bewegung:** Kein Hover-Lift, keine Animationen außer Fokus-Ring.
