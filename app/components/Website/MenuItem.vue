<template>
  <!-- einfacher Link -->
  <li v-if="menuItem.type !== 'submenu' && menuVisible(menuItem)" class="border-b border-border xl:border-0">
    <NuxtLink
      :to="menuUrl(menuItem)"
      :target="menuItem.open_in_new_tab ? '_blank' : undefined"
      :aria-current="isActive(menuItem) ? 'page' : undefined"
      :class="[linkClass, isActive(menuItem) ? activeClass : idleClass]"
      @click="closeMenu">
      {{ menuItem.title }}
    </NuxtLink>
  </li>

  <!-- Untermenü: Dropdown (Desktop) / Akkordeon (mobil) -->
  <li v-else-if="menuItem.type === 'submenu'" ref="wrapper" class="relative border-b border-border xl:border-0" @keydown.escape="closeSubMenu">
    <button
      ref="triggerBtn"
      type="button"
      :aria-controls="`submenu-${menuItem.id}`"
      :aria-expanded="isOpen"
      class="flex w-full cursor-pointer items-center justify-between gap-1 text-left xl:w-auto xl:justify-start"
      :class="[linkClass, isOpen || isChildActive ? activeClass : idleClass]"
      @click="toggleSubMenu">
      <span>{{ menuItem.title }}</span>
      <ChevronDown :size="16" :stroke-width="1.5" class="shrink-0 transition-transform duration-200 motion-reduce:transition-none" :class="{ 'rotate-180': isOpen }" aria-hidden="true" />
    </button>
    <ul
      :id="`submenu-${menuItem.id}`"
      :inert="!isOpen || undefined"
      :aria-hidden="!isOpen || undefined"
      class="overflow-hidden transition-[max-height,opacity] duration-200 motion-reduce:transition-none xl:absolute xl:left-0 xl:top-full xl:mt-1 xl:min-w-[220px] xl:rounded-md xl:border xl:border-border xl:bg-popover xl:p-1 xl:text-popover-foreground xl:shadow-md"
      :class="isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'">
      <template v-for="child in menuItem.children" :key="child.id">
        <li v-if="menuVisible(child)">
          <NuxtLink
            :to="menuUrl(child)"
            :target="child.open_in_new_tab ? '_blank' : undefined"
            :aria-current="isActive(child) ? 'page' : undefined"
            class="block py-2.5 pl-4 text-base transition-colors xl:rounded-sm xl:px-3 xl:py-2 xl:text-sm xl:hover:bg-accent xl:hover:text-accent-foreground"
            :class="isActive(child) ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="closeMenu">
            {{ child.title }}
          </NuxtLink>
        </li>
      </template>
      <!-- mobil: Luft unter dem Akkordeon -->
      <li class="h-2 xl:hidden" aria-hidden="true" />
    </ul>
  </li>
</template>

<script setup lang="ts">
  import { useStore } from '~/stores/store'
  import { ChevronDown } from 'lucide-vue-next'
  import { onClickOutside } from '@vueuse/core'
  import { menuUrl, menuVisible } from '~/utils/menu'

  const props = defineProps({
    menuItem: { type: Object as PropType<any>, required: true },
  })

  // mobil: große Listeneinträge mit Trenner · Desktop: Pill-Links wie shadcn-NavigationMenu
  const linkClass = 'block whitespace-nowrap py-3.5 text-lg font-medium transition-colors xl:rounded-md xl:px-3 xl:py-2 xl:text-sm'
  const idleClass = 'text-foreground/80 hover:text-foreground xl:hover:bg-accent xl:hover:text-accent-foreground'
  const activeClass = 'text-foreground xl:bg-accent xl:text-accent-foreground'

  const store = useStore()
  const route = useRoute()

  const isOpen = computed(() => store.openSubMenuId === props.menuItem?.id)
  const triggerBtn = ref<HTMLElement | null>(null)
  const wrapper = ref<HTMLElement | null>(null)

  function toggleSubMenu() {
    store.openSubMenuId = isOpen.value ? null : props.menuItem.id
  }
  async function closeSubMenu() {
    if (!isOpen.value) return
    store.openSubMenuId = null
    await nextTick()
    triggerBtn.value?.focus()
  }
  function closeMenu() {
    store.menuOpen = false
    store.openSubMenuId = null
  }

  onClickOutside(wrapper, () => { if (isOpen.value) store.openSubMenuId = null })

  function isActive(item: any) {
    const target = menuUrl(item)
    if (target === '#' || target.startsWith('#') || target.includes('://') || target.startsWith('mailto:') || target.startsWith('tel:')) return false
    const path = target.split('#')[0] || '/'
    // Startseite nur bei exakter Übereinstimmung, sonst wären alle „/“-Links auf der Startseite aktiv
    if (path === '/') return route.path === '/' && target === '/'
    return route.path === path || route.path.startsWith(`${path}/`)
  }
  const isChildActive = computed(() => props.menuItem.children?.some((c: any) => isActive(c)) ?? false)
</script>
