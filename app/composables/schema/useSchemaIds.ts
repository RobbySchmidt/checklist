// app/composables/schema/useSchemaIds.ts
// Stabile @id-Werte für den JSON-LD-Graph (Organization, WebSite, WebPage, Breadcrumb) – alle absolut über SITE_URL.

function normalizePath(path: string): string {
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

export function useSchemaIds(siteUrl: string) {
  const base = (siteUrl || '').replace(/\/+$/, '')
  return {
    websiteId: `${base}/#website`,
    orgId: `${base}/#org`,
    webPageId: (path: string) => `${base}${normalizePath(path)}#webpage`,
    breadcrumbId: (path: string) => `${base}${normalizePath(path)}#breadcrumb`,
    /** Absolute URL einer Seite; Startseite mit Trailing-Slash (`https://…/`) */
    pageUrl: (path: string) => (normalizePath(path) === '/' ? `${base}/` : `${base}${normalizePath(path)}`),
  }
}

export type SchemaIds = ReturnType<typeof useSchemaIds>
