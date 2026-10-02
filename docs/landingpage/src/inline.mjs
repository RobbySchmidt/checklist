// Baut aus einer Vorlage eine einzelne HTML-Datei mit eingebetteten Bildern.
// Aufruf: node docs/landingpage/src/inline.mjs <v1|v2> <ausgabe.html>
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const [variant = 'v2', out = resolve(here, '..', `schichtstark-landingpage-${variant}.html`)] = process.argv.slice(2)
let html = readFileSync(resolve(here, variant, 'landingpage.template.html'), 'utf8')
html = html.replace(/src="img\/([a-z0-9-]+\.png)"/g, (_, f) => `src="data:image/png;base64,${readFileSync(resolve(here, 'img', f)).toString('base64')}"`)
writeFileSync(out, html)
console.log(`geschrieben: ${out} (${(statSync(out).size / 1024 / 1024).toFixed(2)} MB)`)
