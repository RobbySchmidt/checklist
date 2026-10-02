<template>
  <BlockSection
    v-if="block"
    :anchor="block.anchor"
    :background="block.background"
    :padding-bottom="block.paddingBottom"
    :labelledby="block.heading ? headingId : ''">
    <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
      <BlockIntro :heading="block.heading" :intro="block.intro" :heading-id="headingId" :background="block.background" />
      <Carousel v-if="images.length" :opts="{ align: 'start', loop: true }" class="text-foreground" aria-label="Bildergalerie">
        <CarouselContent>
          <CarouselItem v-for="(image, i) in images" :key="image.id" class="sm:basis-1/2 lg:basis-1/3">
            <AspectRatio :ratio="4 / 5" class="overflow-hidden rounded-xl bg-muted">
              <img
                :src="getAssetSrc(image, { width: 800, height: 1000, fit: 'cover' })"
                :alt="imageAlt(image, `Galeriebild ${i + 1}`)"
                width="800"
                height="1000"
                loading="lazy"
                class="h-full w-full object-cover">
            </AspectRatio>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious class="left-3" />
        <CarouselNext class="right-3" />
      </Carousel>
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
// Bildergalerie als shadcn-Carousel (embla) – Bilder über M2M block_gallery_files, Reihenfolge über sort
const props = defineProps(blockProps)
const { data: block } = await useBlock(props, ['*', 'images.sort', 'images.directus_files_id.id', 'images.directus_files_id.title', 'images.directus_files_id.description'])

const images = computed<any[]>(() => [...(block.value?.images ?? [])]
  .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  .map((row) => row.directus_files_id)
  .filter(Boolean))
</script>
