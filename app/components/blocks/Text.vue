<template>
  <BlockSection 
    v-if="block" 
    :anchor="block.anchor" 
    :background="block.background" 
    :padding-bottom="block.paddingBottom" 
    :labelledby="block.heading ? headingId : ''">
    <div>
      <div class="mx-auto w-full max-w-3xl px-4 md:px-8 xl:px-0">
        <h2 
          v-if="block.heading" 
          :id="headingId" 
          class="mb-8">{{ block.heading }}</h2>
        <div 
          v-if="block.content" 
          v-html="sanitizeHtml(block.content)" />
      </div>
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
const props = defineProps(blockProps)
const { data: block } = await useBlock(props)
</script>
