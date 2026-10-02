<template>
  <div>
    <WebsiteContentBlockBuilder v-if="homepage?.blocks" :blocks="homepage.blocks" />
    <div v-else>
      <p>Keine Startseite konfiguriert – in Directus unter „Globale Einstellungen" eine Seite als Homepage wählen.</p>
    </div>
  </div>
</template>

<script setup>
  // Startseite = general.homepage (Seite mit Page-Builder-Blöcken)
  const { getItems } = useDirectusItems()
  const { public: pub } = useRuntimeConfig()

  const { data: general } = await useAsyncData('homepageConf', () => getItems({
    collection: 'general',
    params: { fields: ['homepage.*', 'homepage.seo.*', 'homepage.blocks.id', 'homepage.blocks.collection', 'homepage.blocks.item.id'] },
  }))

  const homepage = computed(() => general.value?.homepage ?? null)
  useGenericPageSchema(homepage)

  useSeoMeta({
    title: () => homepage.value?.seo?.title ?? pub.siteName,
    description: () => homepage.value?.seo?.meta_description ?? pub.siteName,
    ogTitle: () => homepage.value?.seo?.title ?? pub.siteName,
    ogDescription: () => homepage.value?.seo?.meta_description ?? pub.siteName,
    ogUrl: () => pub.siteUrl,
    robots: () => {
      if (!homepage.value?.seo) return 'noindex, nofollow'
      const { no_index, no_follow } = homepage.value.seo
      return `${no_index ? 'noindex' : 'index'}, ${no_follow ? 'nofollow' : 'follow'}`
    },
  })
</script>
