<template>
  <BlockSection
    v-if="block"
    :anchor="block.anchor"
    :background="block.background"
    :padding-bottom="block.paddingBottom"
    :labelledby="block.heading ? headingId : ''">
    <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
      <BlockIntro :heading="block.heading" :intro="block.intro" :heading-id="headingId" :background="block.background" />
      <ul class="grid gap-6 sm:grid-cols-2" :class="items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'">
        <li v-for="item in items" :key="item.id">
          <Card class="h-full">
            <CardHeader>
              <img
                v-if="item.image"
                :src="getAssetSrc(item.image, { width: 400 })"
                :alt="imageAlt(item.image)"
                width="400"
                height="400"
                loading="lazy"
                class="mb-2 aspect-square w-32 rounded-lg object-cover">
              <Badge v-if="item.badge" variant="secondary">{{ item.badge }}</Badge>
              <CardTitle><h3>{{ item.title }}</h3></CardTitle>
              <CardDescription v-if="item.text">{{ item.text }}</CardDescription>
            </CardHeader>
            <CardFooter v-if="item.link_label && item.link_url" class="mt-auto">
              <Button as-child variant="link" class="px-0">
                <NuxtLink :to="item.link_url">{{ item.link_label }}<ArrowRight aria-hidden="true" /></NuxtLink>
              </Button>
            </CardFooter>
          </Card>
        </li>
      </ul>
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

const props = defineProps(blockProps)
const { data: block } = await useBlock(props, ['*', 'items.*', 'items.image.id', 'items.image.title', 'items.image.description'])

const items = computed<any[]>(() => [...(block.value?.items ?? [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)))
</script>
