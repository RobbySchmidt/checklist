<template>
  <footer class="relative z-20 px-4 text-[0.95rem] text-white/80 md:px-8 xl:px-4" style="background: #0d2a21">
    <div class="pb-10 pt-14">
      <div class="flex flex-col justify-between gap-12 md:flex-row">
        <div class="flex max-w-[280px] flex-col gap-3.5">
          <NuxtLink to="/" aria-label="Zur Startseite" class="text-[1.3rem] font-bold tracking-[-0.01em] text-white">{{ siteName || 'schichtstark' }}</NuxtLink>
          <p class="max-w-[36ch] leading-[1.6] opacity-80">{{ general?.footer_text || 'Stellenseiten für Pflegedienste, die bei Google erscheinen. Bewerbungen in einer Minute.' }}</p>
        </div>

        <nav aria-label="Footer-Navigation" class="flex flex-wrap gap-x-16 gap-y-8 leading-[2.2]">
          <div v-for="col in columns" :key="col.id">
            <div class="mb-1 font-medium text-white">{{ col.title }}</div>
            <ul>
              <template v-for="child in col.children" :key="child.id">
                <li v-if="menuVisible(child)">
                  <NuxtLink :to="menuUrl(child)" :target="child.open_in_new_tab ? '_blank' : undefined" class="hover:text-[#4ac297]">{{ child.title }}</NuxtLink>
                </li>
              </template>
            </ul>
          </div>
          <div v-if="general">
            <div class="mb-1 font-medium text-white">Kontakt</div>
            <a v-if="general.phone" :href="`tel:${general.phone.replace(/[^\d+]/g, '')}`" class="block hover:text-[#4ac297]">{{ general.phone }}</a>
            <a v-if="general.email" :href="`mailto:${general.email}`" class="block hover:text-[#4ac297]">{{ general.email }}</a>
            <span v-if="general.opening_hours" class="block">{{ general.opening_hours }}</span>
          </div>
        </nav>
      </div>

      <div class="mt-11 flex flex-col gap-2 border-t border-white/10 pt-5 text-sm sm:flex-row sm:justify-between">
        <span>© {{ year }} {{ siteName }}</span>
        <ul v-if="legal?.items?.length" class="flex flex-wrap items-center" aria-label="Rechtliches">
          <template v-for="(item, i) in legal.items" :key="item.id">
            <li v-if="menuVisible(item)" class="flex items-center">
              <span v-if="i > 0" class="px-2" aria-hidden="true">·</span>
              <NuxtLink :to="menuUrl(item)" class="hover:text-[#4ac297]">{{ item.title }}</NuxtLink>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
  import { menuUrl, menuVisible } from '~/utils/menu'

  const { getItems } = useDirectusItems()
  const siteName = (useRuntimeConfig().public.siteName as string) || ''
  const year = new Date().getFullYear()

  const navFields = ['items.*', 'items.page.slug', 'items.children.*', 'items.children.page.slug']
  const loadNav = (title: string) => getItems({ collection: 'navigation', params: { filter: { title: { _eq: title } }, fields: navFields } }) as Promise<any[]>

  const { data: footer } = await useAsyncData('footerNavigation', () => loadNav('Footer'), { transform: (d) => d?.[0] ?? null })
  const { data: legal } = await useAsyncData('legalNavigation', () => loadNav('Legal'), { transform: (d) => d?.[0] ?? null })
  const { data: general } = await useGeneral()

  // Spalten = Untermenüs des Footer-Menüs (Entscheidung: Footer-Spalten als submenu)
  const columns = computed<any[]>(() => (footer.value?.items ?? []).filter((i: any) => i.type === 'submenu' && i.children?.length))
</script>
