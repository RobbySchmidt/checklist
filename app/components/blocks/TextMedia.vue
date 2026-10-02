<template>
  <BlockSection
    v-if="block"
    :anchor="block.anchor"
    :background="block.background"
    :padding-bottom="block.paddingBottom"
    :labelledby="block.heading ? headingId : ''">
    <div class="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-8">
      <div :class="{ 'md:order-2': block.image_position === 'left' }">
        <h2 v-if="block.heading" :id="headingId" class="mb-6 text-3xl font-semibold tracking-tight">{{ block.heading }}</h2>
        <div v-if="block.content" class="space-y-4 text-lg" v-html="sanitizeHtml(block.content)" />
        <Button v-if="block.cta_label && block.cta_url" as-child class="mt-8">
          <NuxtLink :to="block.cta_url">{{ block.cta_label }}</NuxtLink>
        </Button>
      </div>
      <AspectRatio v-if="block.image" :ratio="4 / 3" class="overflow-hidden rounded-xl bg-muted">
        <img
          :src="getAssetSrc(block.image, { width: 1000, height: 750, fit: 'cover' })"
          :alt="imageAlt(block.image)"
          width="1000"
          height="750"
          loading="lazy"
          class="h-full w-full object-cover">
      </AspectRatio>
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
const props = defineProps(blockProps)
const { data: block } = await useBlock(props, ['*', 'image.id', 'image.title', 'image.description'])
</script>
