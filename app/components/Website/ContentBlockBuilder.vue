<script setup lang="ts">
  // Mapping Directus-Block-Collection → Komponente (Lazy). Jeder Block lädt sein Item selbst (useBlock)
  // und rendert seinen eigenen <BlockSection> (Anker + Flächenfarbe).
  // Neue Blöcke: Collection in scripts/setup-schema.mjs (+ BLOCK_COLLECTIONS), Komponente unter
  // components/blocks/, Eintrag hier.
  const map: Record<string, ReturnType<typeof resolveComponent>> = {
    block_text: resolveComponent('LazyBlocksText'),
    block_hero: resolveComponent('LazyBlocksHero'),
    block_features: resolveComponent('LazyBlocksFeatures'),
    block_cards: resolveComponent('LazyBlocksCards'),
    block_text_media: resolveComponent('LazyBlocksTextMedia'),
    block_gallery: resolveComponent('LazyBlocksGallery'),
    block_testimonials: resolveComponent('LazyBlocksTestimonials'),
    block_faq: resolveComponent('LazyBlocksFaq'),
    block_contact: resolveComponent('LazyBlocksContact'),
  }

  defineProps({
    blocks: { type: Array as PropType<any[]>, default: () => [] },
  })
</script>

<template>
  <div id="content" class="relative z-10">
    <template v-for="(block, index) in blocks" :key="block.item?.id ?? index">
      <component
        v-if="block.item && map[block.collection]"
        :is="map[block.collection]"
        :index="index"
        :id="block.item.id"
        :collection="block.collection"
        :heading-id="`block-${block.item.id}`" />

      <DevOnly v-else-if="block.item">
        <div class="bg-red-100 p-4 font-mono text-sm text-red-800">
          Kein Mapping für Block-Collection „{{ block.collection }}" in ContentBlockBuilder.vue
        </div>
      </DevOnly>
    </template>
  </div>
</template>
