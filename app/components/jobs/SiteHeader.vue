<!-- app/components/jobs/SiteHeader.vue: Seitenkopf der Stellenseiten, zeigt nur den Dienst (kein CMS-Menü, keine general-Collection) -->
<template>
  <header id="siteHeader" class="sticky top-0 z-40 w-full border-b border-border px-4 backdrop-blur-[10px] md:px-8" style="background: rgba(244, 247, 245, 0.88)">
    <div class="flex h-16 items-center justify-between gap-6">
      <NuxtLink to="/jobs" class="flex min-w-0 items-center gap-3" aria-label="Zu den offenen Stellen">
        <img v-if="logoSrc" :src="logoSrc" alt="" width="40" height="40" class="h-10 w-10 shrink-0 rounded-lg border border-border bg-white object-contain">
        <span class="truncate text-[1.2rem] font-bold tracking-[-0.01em] text-[#13392d]">{{ employer?.name || siteName }}</span>
      </NuxtLink>
      <a v-if="employer?.website" :href="employer.website" target="_blank" rel="noopener" class="hidden shrink-0 text-sm text-foreground opacity-75 hover:opacity-100 sm:block">Zur Website</a>
    </div>
  </header>
</template>
<script setup lang="ts">
const { employer } = await useEmployer()
const pub = useRuntimeConfig().public
const siteName = (pub.siteName as string) || 'stellenpflege'
const logoSrc = computed(() => { const l = employer.value?.logo; const id = typeof l === 'string' ? l : l?.id; return id ? `${pub.directusUrl}/assets/${id}?width=112&height=112&fit=contain&format=auto` : '' })
</script>
