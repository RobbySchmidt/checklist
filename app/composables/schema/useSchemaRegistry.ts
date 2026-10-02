// app/composables/schema/useSchemaRegistry.ts
// Sammelt JSON-LD-Entities zu einem @graph. Zwei Scopes:
// - 'layout': Organization/WebSite (useBrandSchema im Layout) – bleiben über Client-Navigationen
//   erhalten, weil das Layout dabei nicht neu gemountet wird und die Entities sonst nicht erneut registriert würden
// - 'page' (Standard): WebPage/Breadcrumb … – werden bei jedem Seitenwechsel per reset() verworfen
//   (Router-Hook in app.vue), bevor die neue Seite ihre Entities registriert
// Gleiche @id in beiden Scopes wird im Graph per deepMerge zusammengeführt (Seiten können Layout-Entities um Felder ergänzen).
// Das <script type="application/ld+json"> rendert nur app.vue (ein useHead für den gesamten Graph).
// Die Robustheit des Resets hängt daran, dass Page-Composables Nuxts seitengebundenes useRoute() nutzen (pro Seiteninstanz
// eingefroren) – nicht useRouter().currentRoute, sonst würde der Effect der verlassenen Seite mit dem neuen Pfad erneut feuern.
import type { JsonLdEntity } from '~/utils/schema/types'

type SchemaScope = 'layout' | 'page'

function deepMerge(a: any, b: any): any {
  if (Array.isArray(a) && Array.isArray(b)) {
    const merged = [...a, ...b]
    return Array.from(new Set(merged.map(x => JSON.stringify(x)))).map(s => JSON.parse(s))
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const out: any = { ...a }
    for (const k of Object.keys(b)) {
      out[k] = k in out ? deepMerge(out[k], b[k]) : b[k]
    }
    return out
  }
  return b ?? a
}

export function useSchemaRegistry(options: { scope?: SchemaScope } = {}) {
  const layoutEntities = useState<Record<string, JsonLdEntity>>('schema:layout', () => ({}))
  const pageEntities = useState<Record<string, JsonLdEntity>>('schema:page', () => ({}))
  // Entities ohne @id sind immer seitenbezogen
  const anon = useState<JsonLdEntity[]>('schema:anon', () => [])
  const entities = options.scope === 'layout' ? layoutEntities : pageEntities

  // add() wird aus watchEffects der Seiten aufgerufen (useGenericPageSchema). Die Lesezugriffe hier laufen
  // deshalb über toRaw, damit der Effect KEINE reaktive Abhängigkeit auf die Registry bekommt – sonst würde reset() den
  // Effect der gerade verlassenen Seite erneut anstoßen und der registriert seine alten Entities gleich wieder.
  function add(entity: JsonLdEntity) {
    if (!entity) return
    const id = entity['@id']
    if (id) {
      const current = toRaw(entities.value)[id]
      if (!current) {
        entities.value[id] = entity
      } else {
        const merged = deepMerge(current, entity)
        if (JSON.stringify(merged) !== JSON.stringify(current)) {
          entities.value[id] = merged
        }
      }
    } else {
      if (import.meta.dev && options.scope === 'layout') {
        console.warn('[schema] Entity ohne @id im Layout-Scope registriert – landet im Page-Bucket und fällt beim nächsten Seitenwechsel weg:', entity)
      }
      const key = JSON.stringify(entity)
      if (!toRaw(anon.value).some(e => JSON.stringify(e) === key)) {
        anon.value.push(entity)
      }
    }
  }

  function addMany(list: JsonLdEntity[] | null | undefined) {
    if (!list) return
    for (const e of list) add(e)
  }

  const graph = computed(() => {
    const byId: Record<string, JsonLdEntity> = { ...layoutEntities.value }
    for (const [id, entity] of Object.entries(pageEntities.value)) {
      byId[id] = id in byId ? deepMerge(byId[id], entity) : entity
    }
    return [...Object.values(byId), ...anon.value]
  })

  const jsonLd = computed(() => {
    if (!graph.value.length) return null
    return { '@context': 'https://schema.org', '@graph': graph.value }
  })

  /** Verwirft nur die Seiten-Entities – der Layout-Scope bleibt (siehe Kopfkommentar).
   *  In-place leeren statt `.value = {}`: das Ersetzen würde alle Effects triggern, die `.value` gelesen haben. */
  function reset() {
    for (const id of Object.keys(pageEntities.value)) delete pageEntities.value[id]
    anon.value.splice(0)
  }

  return { add, addMany, reset, graph, jsonLd }
}
