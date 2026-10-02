// Namen der Directus-Collections des Produkts. Präfix sp_, damit sie in einer geteilten Directus-Instanz
// nicht mit fremden Collections (z. B. einer anderen „jobs“) kollidieren. Nur hier ändern.
export const COLLECTION_PREFIX = 'sp_'

export const C = {
  folder: 'stellenpflege',
  employers: 'sp_employers',
  jobs: 'sp_jobs',
  applications: 'sp_applications',
  portalUsers: 'sp_portal_users',
  loginTokens: 'sp_login_tokens',
  jobViews: 'sp_job_views',
} as const

/** Alle Tabellen des Produkts (ohne den Ordner), z. B. für Kopier- und Rechte-Skripte. */
export const PRODUCT_COLLECTIONS: string[] = [C.employers, C.jobs, C.applications, C.portalUsers, C.loginTokens, C.jobViews]
