<template>
  <BlockSection
    v-if="block"
    :anchor="block.anchor"
    :background="block.background"
    :padding-bottom="block.paddingBottom"
    :labelledby="block.heading ? headingId : ''">
    <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
      <BlockIntro :heading="block.heading" :intro="block.intro" :heading-id="headingId" :background="block.background" />
      <component :is="numbered ? 'ol' : 'ul'" class="grid gap-4 sm:grid-cols-2" :class="items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'">
        <li v-for="(item, i) in items" :key="i">
          <Item variant="outline" class="h-full items-start bg-card text-card-foreground">
            <ItemMedia variant="icon">
              <span v-if="numbered" class="text-sm font-semibold" aria-hidden="true">{{ i + 1 }}</span>
              <Icon v-else-if="item.icon" :name="item.icon" :size="16" aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{{ item.title }}</ItemTitle>
              <ItemDescription v-if="item.text" class="line-clamp-none">{{ item.text }}</ItemDescription>
            </ItemContent>
          </Item>
        </li>
      </component>
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
// Kurzargumente mit Icon (variant „icons“) oder nummerierte Schritte (variant „numbered“)
const props = defineProps(blockProps)
const { data: block } = await useBlock(props)

const items = computed<any[]>(() => block.value?.items ?? [])
const numbered = computed(() => block.value?.variant === 'numbered')
</script>
