<template>
  <footer class="relative z-20 border-t border-border px-4 md:px-8 xl:px-4">
    <div class="pb-10 pt-14">
      <div class="flex flex-col justify-between gap-12 md:flex-row">
        <div class="flex max-w-[280px] flex-col gap-3.5">
          <NuxtLink to="/" aria-label="Zur Startseite">
            <img
              v-if="general?.logo"
              :src="getAssetUrl() + general.logo.filename_disk"
              :alt="general.logo.title || siteName"
              width="140"
              height="37"
              class="block h-auto w-[140px] opacity-90">
          </NuxtLink>
          <p v-if="general?.footer_text" class="text-xs leading-[1.6] text-muted-foreground">{{ general.footer_text }}</p>
        </div>

        <nav aria-label="Footer-Navigation" class="flex flex-wrap gap-x-16 gap-y-8 text-xs leading-[2.2] text-muted-foreground">
          <div v-for="col in columns" :key="col.id">
            <div class="mb-1 font-semibold text-foreground">{{ col.title }}</div>
            <ul>
              <template v-for="child in col.children" :key="child.id">
                <li v-if="menuVisible(child)">
                  <NuxtLink :to="menuUrl(child)" :target="child.open_in_new_tab ? '_blank' : undefined" class="hover:text-foreground">{{ child.title }}</NuxtLink>
                </li>
              </template>
            </ul>
          </div>
          <div v-if="general">
            <div class="mb-1 font-semibold text-foreground">Kontakt</div>
            <a v-if="general.phone" :href="`tel:${general.phone.replace(/[^\d+]/g, '')}`" class="block hover:text-foreground">{{ general.phone }}</a>
            <a v-if="general.email" :href="`mailto:${general.email}`" class="block hover:text-foreground">{{ general.email }}</a>
            <span v-if="general.opening_hours" class="block">{{ general.opening_hours }}</span>
          </div>
        </nav>
      </div>

      <div class="mt-11 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {{ year }} {{ siteName }}</span>
        <ul v-if="legal?.items?.length" class="flex flex-wrap items-center" aria-label="Rechtliches">
          <template v-for="(item, i) in legal.items" :key="item.id">
            <li v-if="menuVisible(item)" class="flex items-center">
              <span v-if="i > 0" class="px-2" aria-hidden="true">·</span>
              <NuxtLink :to="menuUrl(item)" class="hover:text-foreground">{{ item.title }}</NuxtLink>
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
