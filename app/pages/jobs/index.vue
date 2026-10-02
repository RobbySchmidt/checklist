<template>
  <div class="jobs-paper text-foreground">
    <div class="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
      <section aria-labelledby="jobs-heading" class="overflow-hidden rounded-lg border border-border bg-white">
        <header class="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div class="grid min-w-0 gap-1">
            <h1 id="jobs-heading" class="text-xl font-medium">{{ employer?.name }}</h1>
            <p v-if="employer?.service_area" class="text-sm text-foreground opacity-75">{{ employer.service_area }}</p>
          </div>
          <img v-if="logoSrc" :src="logoSrc" alt="" width="40" height="40" class="h-10 w-10 shrink-0 rounded-lg border border-border bg-white object-contain">
        </header>
        <ul v-if="jobs?.length" class="divide-y divide-border">
          <li v-for="job in jobs" :key="job.id"><JobsJobCard :job="job" :employer="employer!" /></li>
        </ul>
        <p v-else class="px-5 py-4 text-sm text-foreground opacity-75">Gerade ist keine Stelle offen. Schauen Sie bald wieder vorbei.</p>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
useHead({ htmlAttrs: { class: 'font-roboto' } })
const { employer } = await useEmployer()
if (!employer.value) throw createError({ statusCode: 503, statusMessage: 'Dienst nicht konfiguriert', fatal: true })
const pub = useRuntimeConfig().public
const logoSrc = computed(() => { const l = employer.value?.logo; const id = typeof l === 'string' ? l : l?.id; return id ? `${pub.directusUrl}/assets/${id}?width=112&height=112&fit=contain&format=auto` : '' })
const { data: jobs } = await useJobs()
useGenericPageSchema({ title: 'Offene Stellen' })
useSeoMeta({
  title: () => `Offene Stellen – ${employer.value?.name}`,
  description: () => `Jobs in der Pflege bei ${employer.value?.name}: ${employer.value?.service_area ?? ''}. Bewerbung in einer Minute vom Handy.`,
})
</script>
