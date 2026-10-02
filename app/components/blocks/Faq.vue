<template>
  <BlockSection
    v-if="block"
    :anchor="block.anchor"
    :background="block.background"
    :padding-bottom="block.paddingBottom"
    :labelledby="block.heading ? headingId : ''">
    <div class="mx-auto w-full max-w-3xl px-4 md:px-8 xl:px-0">
      <BlockIntro :heading="block.heading" :intro="block.intro" :heading-id="headingId" :background="block.background" />
      <Accordion type="single" collapsible>
        <AccordionItem v-for="(item, i) in items" :key="i" :value="`faq-${i}`">
          <AccordionTrigger class="text-base">{{ item.question }}</AccordionTrigger>
          <AccordionContent class="text-base whitespace-pre-line" :class="mutedClass(block.background)">{{ item.answer }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
import { buildFaqEntity } from '~/utils/schema/buildFaqEntity'

const props = defineProps(blockProps)
const { data: block } = await useBlock(props)

const items = computed<any[]>(() => block.value?.items ?? [])

// FAQPage als JSON-LD (Page-Scope der Schema-Registry, wird beim Seitenwechsel verworfen)
const route = useRoute()
const registry = useSchemaRegistry()
const siteUrl = useRuntimeConfig().public.siteUrl as string
watchEffect(() => {
  const entity = buildFaqEntity({ path: route.path, siteUrl, items: items.value })
  if (entity) registry.add(entity)
})
</script>
