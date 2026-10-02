// Helfer für navigation_items (Typen page | url | submenu)
export function menuUrl(item: any): string {
  if (!item) return '#'
  if (item.type === 'page') return item.page?.slug ? `/${item.page.slug}` : '#'
  return item.url || '#'
}

// Seiten-Links ohne verknüpfte Seite (gelöscht/unveröffentlicht) ausblenden
export function menuVisible(item: any): boolean {
  if (item.type === 'page') return !!item.page
  return true
}
