<template>
  <BlockSection
    v-if="block"
    :anchor="block.anchor"
    :background="block.background"
    :padding-bottom="block.paddingBottom"
    :labelledby="headingId">
    <div class="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 md:px-8" :class="{ 'md:grid-cols-2': block.image }">
      <div :class="{ 'max-w-3xl': !block.image }">
        <Badge v-if="block.badge" variant="secondary" class="mb-4">{{ block.badge }}</Badge>
        <h1 :id="headingId" class="text-4xl font-extrabold tracking-tight text-balance lg:text-5xl">{{ block.heading }}</h1>
        <p v-if="block.text" class="mt-6 text-xl" :class="mutedClass(block.background)">{{ block.text }}</p>
        <div v-if="block.cta_label || block.cta2_label" class="mt-8 flex flex-wrap gap-3">
          <Button v-if="block.cta_label && block.cta_url" as-child size="lg">
            <NuxtLink :to="block.cta_url">{{ block.cta_label }}</NuxtLink>
          </Button>
          <Button v-if="block.cta2_label && block.cta2_url" as-child size="lg" variant="outline" class="text-foreground">
            <NuxtLink :to="block.cta2_url">{{ block.cta2_label }}</NuxtLink>
          </Button>
        </div>
      </div>
      <img
        v-if="block.image"
        :src="getAssetSrc(block.image, { width: 900 })"
        :alt="imageAlt(block.image)"
        :width="block.image.width || undefined"
        :height="block.image.height || undefined"
        fetchpriority="high"
        class="mx-auto h-auto w-full max-w-md rounded-xl md:max-w-none">
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
const props = defineProps(blockProps)
const { data: block } = await useBlock(props, ['*', 'image.id', 'image.title', 'image.description', 'image.width', 'image.height'])
</script>
