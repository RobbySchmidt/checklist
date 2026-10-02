// Redirects alter URLs – Liste aus Directus (Collection `redirects`, anonym gelesen, ~5 min gecacht),
// dazu generisch: Trailing-Slash strippen (/seite/ → /seite). Mit Cache + Fail-open (Directus nicht erreichbar → keine Redirects, Seite läuft weiter).
// Der Hash (#anker) kommt nie beim Server an – Browser hängen ihn bei einem Location-Header ohne eigenen Hash selbst wieder an.
type Redirect = { from: string; to: string; code: 301 | 302 }

const RETRY_AFTER_ERROR_MS = 30 * 1000
const FETCH_TIMEOUT_MS = 5000
// Prozesslokaler Cache: nicht cluster-fähig – reicht für einen Container.
// `loaded` = mindestens einmal erfolgreich aus Directus geladen (auch eine leere Liste ist ein gültiger Stand)
type RedirectCache = { list: Redirect[]; validUntil: number; loaded: boolean }
let cache: RedirectCache = { list: [], validUntil: 0, loaded: false }
let inflight: Promise<Redirect[]> | null = null

const normalizePath = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

function refreshRedirects(directusUrl: string, cacheSeconds: number): Promise<Redirect[]> {
  if (inflight) return inflight
  inflight = $fetch<{ data: Array<{ from: string; to: string; code: string | number | null }> }>(`${directusUrl}/items/redirects`, {
    query: { fields: 'from,to,code', filter: { status: { _eq: 'published' } }, limit: -1 },
    timeout: FETCH_TIMEOUT_MS, // hängendes Directus blockiert Requests nicht bis zum Undici-Timeout → landet im catch
  })
    .then((res) => {
      const list: Redirect[] = (res?.data ?? [])
        .filter((r) => r.from && r.to)
        .map((r): Redirect => {
          const to = r.to.trim()
          return {
            from: normalizePath(r.from.trim()).toLowerCase(),
            to: to.startsWith('/') ? normalizePath(to) : to, // interne Ziele normalisieren, sonst Loop über die Trailing-Slash-Regel
            code: Number(r.code) === 302 ? 302 : 301,
          }
        })
        .filter((r) => r.from !== r.to.toLowerCase()) // Loop-Schutz: Redirect auf sich selbst
      cache = { list, validUntil: Date.now() + cacheSeconds * 1000, loaded: true }
      return list
    })
    .catch((err: unknown) => {
      // Fail open: Seite muss auch ohne Directus ausliefern – alte Liste weiterverwenden, kurz warten bis zum nächsten Versuch
      console.warn('Redirects konnten nicht aus Directus geladen werden:', err instanceof Error ? err.message : err)
      cache = { ...cache, validUntil: Date.now() + RETRY_AFTER_ERROR_MS }
      return cache.list
    })
    .finally(() => { inflight = null })
  return inflight
}

// Stale-while-revalidate: nur Requests vor dem ersten erfolgreichen Laden warten auf Directus,
// danach wird bei Ablauf im Hintergrund nachgeladen und sofort die alte Liste benutzt.
// Kriterium ist das `loaded`-Flag, nicht `list.length` – eine leere Collection (z. B. alle Redirects archiviert)
// würde sonst nach jedem Cache-Ablauf wieder jeden Request blockierend nachladen lassen. Schlägt schon das erste Laden fehl,
// liefern Requests während der 30-s-Sperre (validUntil) die leere Liste ohne Warten; danach wartet der nächste wieder auf Directus.
function loadRedirects(directusUrl: string, cacheSeconds: number): Promise<Redirect[]> {
  if (Date.now() < cache.validUntil) return Promise.resolve(cache.list)
  const refresh = refreshRedirects(directusUrl, cacheSeconds)
  return cache.loaded ? Promise.resolve(cache.list) : refresh
}

// Query-String ans Ziel hängen – vor einem eventuellen #anker im Ziel, ohne bestehende Query zu überschreiben
function withSearch(to: string, search: string) {
  if (!search) return to
  const hashAt = to.indexOf('#')
  const base = hashAt < 0 ? to : to.slice(0, hashAt)
  const hash = hashAt < 0 ? '' : to.slice(hashAt)
  const joined = base.includes('?') ? `${base}&${search.slice(1)}` : `${base}${search}`
  return `${joined}${hash}`
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const url = getRequestURL(event)
  const { pathname, search } = url
  // Root, Nuxt-Interna (/_nuxt, /_ipx, /__nuxt_error), API und statische Dateien (mit Endung) nie anfassen
  if (pathname === '/' || pathname.startsWith('/_') || pathname.startsWith('/api/') || /\.[a-z0-9]+$/i.test(pathname)) return

  const config = useRuntimeConfig(event)
  const directusUrl = config.public.directusUrl as string | undefined
  const cacheSeconds = Number(config.redirects?.cacheSeconds) || 300
  const path = normalizePath(pathname)

  if (directusUrl) {
    const key = path.toLowerCase()
    const hit = (await loadRedirects(directusUrl, cacheSeconds)).find((r) => r.from === key)
    if (hit) return sendRedirect(event, withSearch(hit.to, search), hit.code)
  }

  // Generisch: Trailing-Slash entfernen (alle Live-URLs endeten auf "/")
  if (path !== pathname) return sendRedirect(event, `${path}${search}`, 301)
})
