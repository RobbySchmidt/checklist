<template>
  <div class="grid gap-2">
    <span :id="`${uid}-l`" class="text-sm font-medium">{{ label }}</span>
    <div class="flex flex-wrap items-center gap-3" role="group" :aria-labelledby="`${uid}-l`">
      <span class="relative size-12 shrink-0 overflow-hidden rounded-full border border-border focus-within:ring-2 focus-within:ring-offset-2" :style="{ background: valid ? modelValue : 'transparent' }">
        <input type="color" :value="valid ? modelValue : '#ffffff'" :aria-label="`${label}: Farbe wählen`" class="absolute inset-0 size-full cursor-pointer opacity-0" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value.toLowerCase())">
      </span>
      <span class="text-sm opacity-75">{{ modelValue || 'Standard' }}</span>
      <input type="text" :value="modelValue" :aria-label="`${label}: Farbcode einfügen`" placeholder="#1d6b57" maxlength="7" class="portal-input !min-h-9 !w-28 !px-3 text-sm" @change="onText">
      <button type="button" class="inline-flex min-h-9 items-center text-sm font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2" @click="emit('update:modelValue', '')">Zurücksetzen</button>
    </div>
    <div class="flex flex-wrap gap-2">
      <button v-for="p in PRESETS" :key="p.hex" type="button" :aria-label="p.name" :title="p.name" :aria-pressed="modelValue === p.hex" class="size-8 rounded-full border border-border focus-visible:outline-2 focus-visible:outline-offset-2" :class="modelValue === p.hex ? 'ring-2 ring-offset-2' : ''" :style="{ background: p.hex }" @click="emit('update:modelValue', p.hex)" />
    </div>
    <p v-if="hint" class="text-sm opacity-75">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { isHex, normalizeHex } from '#shared/utils/color'

const props = defineProps<{ modelValue: string; label: string; hint?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const uid = useId()
const valid = computed(() => isHex(props.modelValue))
const PRESETS = [
  { name: 'Tiefgrün', hex: '#1d6b57' }, { name: 'Mint', hex: '#4ac297' }, { name: 'Blau', hex: '#2563eb' }, { name: 'Marine', hex: '#1e3a5f' },
  { name: 'Violett', hex: '#6d28d9' }, { name: 'Bordeaux', hex: '#9f1239' }, { name: 'Orange', hex: '#ea580c' }, { name: 'Anthrazit', hex: '#374151' },
]
function onText(e: Event) {
  const el = e.target as HTMLInputElement
  const v = normalizeHex(el.value)
  el.value = v
  emit('update:modelValue', v)
}
</script>
