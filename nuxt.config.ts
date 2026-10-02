import tailwindcss from '@tailwindcss/vite'

// SITE_NAME ist bei Netlify reserviert (= Projekt-Slug) – dort NUXT_PUBLIC_SITE_NAME setzen, hat Vorrang
const siteName = process.env.NUXT_PUBLIC_SITE_NAME || process.env.SITE_NAME

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ['@pinia/nuxt', 'nuxt-directus', '@nuxtjs/sitemap', 'shadcn-nuxt', 'nuxt-auth-utils'],

  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui'
  },

  imports: {
    dirs: ['composables/schema', 'utils', 'composables'],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Archivo:wght@500;700&family=Space+Mono&display=swap' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in', appear: true },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  directus: {
    url: process.env.DIRECTUS_URL,
    autoFetch: false,
  },

  // Absolute URLs in der Sitemap (nuxt-site-config, kommt mit @nuxtjs/sitemap)
  site: {
    url: process.env.SITE_URL,
    name: siteName,
  },

  // /sitemap.xml – Seiten aus Directus (server/api/__sitemap__/pages.ts)
  sitemap: {
    sources: ['/api/__sitemap__/pages'],
    exclude: ['/kein-dienst'],
  },

  nitro: {
    experimental: { tasks: true },
    scheduledTasks: { '0 * * * *': ['reminders'], '0 6 * * *': ['report'] },
  },

  runtimeConfig: {
    public: {
      siteName,
      siteUrl: process.env.SITE_URL,
      directusUrl: process.env.DIRECTUS_URL,
      employerSlug: process.env.EMPLOYER_SLUG,
    },
    // Redirects aus Directus (server/middleware/redirects.ts) – Cache-Dauer in Sekunden, per NUXT_REDIRECTS_CACHE_SECONDS überschreibbar
    redirects: {
      cacheSeconds: 300,
    },
    notifyBcc: process.env.NOTIFY_BCC || '',
    // mail.* wird zur Laufzeit aus NUXT_MAIL_HOST usw. befüllt; secure als String, damit die Env-Überschreibung greift
    mail: { host: '', port: '587', secure: 'false', user: '', pass: '', from: '' },
    directusAppToken: process.env.DIRECTUS_APP_TOKEN || '',
    taskSecret: process.env.TASK_SECRET || '',
    portalBaseUrl: process.env.PORTAL_BASE_URL || '',
    session: { maxAge: 60 * 60 * 24 * 30 },
  },
})