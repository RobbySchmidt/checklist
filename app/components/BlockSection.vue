<template>
  <component
    :is="as"
    :id="anchor || undefined"
    :aria-labelledby="labelledby || undefined"
    :class="[bgClass, { 'scroll-mt-20': anchor }, { 'pb-f-24': paddingBottom }]"
    class="pt-f-24">
    <slot />
  </component>
</template>

<script setup lang="ts">
// Gemeinsamer Rahmen jedes Blocks: Anker (#deeplinks aus dem Menü) + Flächenfarbe.
// Im CMS wählbar (`blockCommon` in scripts/lib/fields.mjs): white | background | primary | secondary – reine Tokens,
// die Labels (BG_CHOICES) und die Farben (tailwind.css) werden pro Projekt getauscht.
const props = defineProps({
  labelledby: { type: String, default: '' },
  anchor: { type: String, default: '' },
  paddingBottom: { type: Boolean, default: false },
  background: { type: String, default: 'white' },
  as: { type: String, default: 'section' },
})

const bgClass = computed(() => ({
  white: 'bg-white text-foreground',
  background: 'bg-background text-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
}[props.background] ?? 'bg-white text-foreground'))

</script>
