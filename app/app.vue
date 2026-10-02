<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
  const { public: pub}  = useRuntimeConfig()
  useSeoMeta({
    title: pub.siteName,
    ogTitle: pub.siteName,
    ogType: 'website',
    ogImage: '/open-graph.png',
    ogUrl: pub.siteUrl,
    twitterCard: 'summary_large_image',
    twitterImage: '/open-graph.png',
  })

  // JSON-LD: Seiten-Entities (WebPage/Breadcrumb) bei Client-Navigation verwerfen, bevor die neue
  // Seite ihre eigenen registriert – Layout-Entities (Organization/WebSite) bleiben, weil das Layout nicht neu mountet.
  // afterEach statt beforeEach: feuert nur bei erfolgreicher Navigation, läuft aber noch vor dem Setup der neuen Seite.
  // Nur bei Pfadwechsel – Hash-/Query-Änderungen mounten die Seite nicht neu, ihre Entities müssen also bleiben.
  const schemaRegistry = useSchemaRegistry()
  // Das eine <script type="application/ld+json"> für den gesamten Graph – die Registry selbst rendert nichts
  useHead(() => schemaRegistry.jsonLd.value
    ? { script: [{ key: 'schema-org-graph', type: 'application/ld+json', innerHTML: JSON.stringify(schemaRegistry.jsonLd.value) }] }
    : {})
  if (import.meta.client) {
    useRouter().afterEach((to, from, failure) => {
      if (!failure && to.path !== from.path) schemaRegistry.reset()
    })
  }
</script>

<style>
  .page-enter-active,
  .page-leave-active {
    transition: all 0.2s;
  }
  .page-enter-from,
  .page-leave-to {
    opacity: 0;
  }
</style>