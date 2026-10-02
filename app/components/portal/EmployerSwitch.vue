<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button type="button" class="portal-switch flex h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm font-medium" aria-label="Dienst wechseln">
        <Building2 class="size-4 shrink-0" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate">{{ current?.name ?? '…' }}</span>
        <ChevronsUpDown class="size-4 shrink-0 opacity-70" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="portal w-(--reka-dropdown-menu-trigger-width) min-w-60 p-1" style="background: var(--portal-white); border-color: var(--portal-line); color: var(--portal-ink)">
      <p class="portal-eyebrow px-2 py-2" style="background: transparent">Dienst wechseln</p>
      <DropdownMenuRadioGroup :model-value="current?.id" @update:model-value="(v) => emit('switch', String(v))">
        <DropdownMenuRadioItem v-for="e in employers" :key="e.id" :value="e.id" class="portal-switch-item !h-10 !pl-8 !pr-2" :style="e.id === current?.id ? { color: 'var(--portal-ink)', fontWeight: 500 } : {}">
          <template #indicator-icon><Check class="size-4" /></template>
          <span class="truncate">{{ e.name }}</span>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
<script setup lang="ts">
import { Building2, ChevronsUpDown, Check } from 'lucide-vue-next'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '~/components/ui/dropdown-menu'

defineProps<{ employers: { id: string; name: string }[]; current?: { id: string; name: string } | null }>()
const emit = defineEmits<{ switch: [id: string] }>()
</script>
<style scoped>
.portal-switch { background: color-mix(in srgb, white 8%, transparent); border-color: color-mix(in srgb, white 15%, transparent); color: white; }
.portal-switch:focus-visible { outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--portal-mint) 70%, transparent); }
@media (hover: hover) { .portal-switch:hover { background: color-mix(in srgb, white 12%, transparent); } }
</style>
