/** Alt-Text eines Directus-Bildes: Titel der Datei, sonst Fallback. */
export const imageAlt = (image: unknown, fallback = ''): string => {
  if (image && typeof image === 'object' && 'title' in image) {
    const title = (image as { title?: string | null }).title
    if (title) return title
  }
  return fallback
}
