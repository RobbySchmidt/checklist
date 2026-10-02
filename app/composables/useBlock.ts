// Lädt das Item eines Page-Builder-Blocks (jeder Block lädt sich selbst, siehe ContentBlockBuilder.vue).
// Standard-Felder: alle Spalten des Blocks. Blöcke mit Relationen/Dateien geben ihre Feldliste explizit mit (z. B. ['*', 'image.*']).
export function useBlock<T = any>(props: { id: string; collection: string }, fields: string[] = ['*']) {
  const { getItemById } = useDirectusItems()
  return useAsyncData<T>(
    `block:${props.collection}:${props.id}`,
    () => getItemById({ collection: props.collection, id: props.id, params: { fields } }) as Promise<T>,
  )
}

// Sekundärtext passend zur Flächenfarbe (BlockSection.vue): auf der Primärfläche wäre text-muted-foreground zu kontrastarm
export function mutedClass(background?: string | null): string {
  return background === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
}

export const blockProps = {
  id: { type: String, required: true },
  collection: { type: String, required: true },
  index: { type: Number, default: 0 },
  headingId: { type: String, default: '' },
} as const
