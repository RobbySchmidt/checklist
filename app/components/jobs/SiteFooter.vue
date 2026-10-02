<!-- app/components/jobs/SiteFooter.vue: Fußzeile der Stellenseiten mit Anschrift und Rechtslinks des Dienstes -->
<template>
  <footer class="relative z-20 px-4 text-[0.95rem] text-white/80 md:px-8" style="background: #0d2a21">
    <div class="pb-8 pt-12">
      <div class="flex flex-col justify-between gap-10 md:flex-row">
        <div class="grid max-w-[36ch] gap-2">
          <span class="text-[1.2rem] font-bold tracking-[-0.01em] text-white">{{ employer?.name }}</span>
          <p v-if="employer?.legal_name && employer.legal_name !== employer.name" class="opacity-80">{{ employer.legal_name }}</p>
          <p v-if="employer" class="opacity-80">{{ employer.address_street }}, {{ employer.address_zip }} {{ employer.address_city }}</p>
          <a v-if="employer?.phone" :href="`tel:${employer.phone.replace(/[^\d+]/g, '')}`" class="w-fit hover:text-[#4ac297]">{{ employer.phone }}</a>
        </div>
        <nav aria-label="Rechtliches" class="flex flex-wrap items-start gap-x-8 gap-y-2 leading-[2]">
          <NuxtLink to="/jobs" class="hover:text-[#4ac297]">Offene Stellen</NuxtLink>
          <a v-if="employer?.website" :href="employer.website" target="_blank" rel="noopener" class="hover:text-[#4ac297]">Website</a>
          <a v-if="employer?.imprint_url" :href="employer.imprint_url" target="_blank" rel="noopener" class="hover:text-[#4ac297]">Impressum</a>
          <a v-if="employer?.privacy_url" :href="employer.privacy_url" target="_blank" rel="noopener" class="hover:text-[#4ac297]">Datenschutz</a>
        </nav>
      </div>
      <div class="mt-9 flex flex-col gap-2 border-t border-white/10 pt-4 text-sm sm:flex-row sm:justify-between">
        <span>© {{ year }} {{ employer?.legal_name || employer?.name }}</span>
        <span class="opacity-70">Stellenseite von {{ siteName }}</span>
      </div>
    </div>
  </footer>
</template>
<script setup lang="ts">
const { employer } = await useEmployer()
const siteName = (useRuntimeConfig().public.siteName as string) || 'stellenpflege'
const year = new Date().getFullYear()
</script>
