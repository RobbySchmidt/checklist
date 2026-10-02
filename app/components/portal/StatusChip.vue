<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium leading-5"
    :style="{ color: `var(--portal-${tone}-fg)`, background: `var(--portal-${tone}-bg)` }"
  >{{ LABELS[status] ?? status }}</span>
</template>
<script setup lang="ts">
const props = defineProps<{ status: string }>()
const LABELS: Record<string, string> = {
  neu: 'Neu', kontaktiert: 'Kontaktiert', gespraech: 'Gespräch', zusage: 'Zusage', absage: 'Absage',
  published: 'Veröffentlicht', draft: 'Entwurf', filled: 'Besetzt', expired: 'Abgelaufen',
}
// Stellen-Stand nutzt dieselben Paare: published = Grün, draft/expired = Grau, filled = Blau.
const TONES: Record<string, string> = { published: 'zusage', draft: 'absage', filled: 'kontaktiert', expired: 'absage' }
const tone = computed(() => TONES[props.status] ?? (props.status in LABELS ? props.status : 'absage'))
</script>
