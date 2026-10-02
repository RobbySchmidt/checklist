<!-- app/components/jobs/JobList.vue: alle offenen Stellen des Dienstes, linke Spalte der Stellenseiten -->
<template>
  <section aria-labelledby="jobs-heading" class="lp-card overflow-hidden">
    <header class="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
      <div class="grid min-w-0 gap-1">
        <component :is="headingTag" id="jobs-heading" class="text-xl lp-title">{{ employer.name }}</component>
        <p v-if="employer.service_area" class="text-sm text-foreground opacity-75">{{ employer.service_area }}</p>
      </div>
      <img v-if="logoSrc" :src="logoSrc" alt="" width="40" height="40" class="h-10 w-10 shrink-0 rounded-lg border border-border bg-white object-contain">
    </header>
    <ul v-if="jobs.length" class="divide-y divide-border">
      <li v-for="job in jobs" :key="job.id"><JobsJobCard :job="job" :employer="employer" :active="job.slug === activeSlug" /></li>
    </ul>
    <p v-else class="px-5 py-4 text-sm text-foreground opacity-75">Gerade ist keine Stelle offen. Schauen Sie bald wieder vorbei.</p>
  </section>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
const props = withDefaults(defineProps<{ jobs: Job[]; employer: Employer; activeSlug?: string; headingTag?: 'h1' | 'h2' }>(), { activeSlug: '', headingTag: 'h1' })
const pub = useRuntimeConfig().public
const logoSrc = computed(() => { const l = props.employer.logo; const id = typeof l === 'string' ? l : l?.id; return id ? `${pub.directusUrl}/assets/${id}?width=112&height=112&fit=contain&format=auto` : '' })
</script>
