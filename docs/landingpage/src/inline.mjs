// Baut aus landingpage.template.html eine einzelne HTML-Datei mit eingebetteten Bildern (data-URIs).
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = process.argv[2] || resolve(here, 'pflege-jobs-landingpage.html')
let html = readFileSync(resolve(here, 'landingpage.template.html'), 'utf8')
let total = 0
html = html.replace(/src="img\/([a-z0-9-]+\.png)"/g, (_, file) => {
  const buf = readFileSync(resolve(here, 'img', file))
  total += buf.length
  return `src="data:image/png;base64,${buf.toString('base64')}"`
})
writeFileSync(out, html)
console.log(`geschrieben: ${out} (${(statSync(out).size / 1024 / 1024).toFixed(2)} MB, Bilder ${(total / 1024).toFixed(0)} KB)`)
