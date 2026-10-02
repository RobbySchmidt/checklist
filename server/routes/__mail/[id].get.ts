// server/routes/__mail/[id].get.ts
// Nur im Dev-Modus: zeigt eine abgelegte Mailvorschau aus .data/mail-preview/<id>.html
import { readFile } from 'node:fs/promises'

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  const id = getRouterParam(event, 'id') || ''
  if (!/^[0-9a-f-]{36}$/.test(id)) throw createError({ statusCode: 404 })
  try {
    const html = await readFile(`.data/mail-preview/${id}.html`, 'utf8')
    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    return html
  } catch {
    throw createError({ statusCode: 404 })
  }
})
