<template>
  <div class="bg-[#f8f9fa] text-[#202124]">
    <div class="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
      <section aria-labelledby="jobs-heading" class="overflow-hidden rounded-lg border border-[#dadce0] bg-white">
        <header class="grid gap-1 border-b border-[#dadce0] px-5 py-4">
          <h1 id="jobs-heading" class="text-xl font-medium">{{ employer?.name }}</h1>
          <p v-if="employer?.service_area" class="text-sm text-[#5f6368]">{{ employer.service_area }}</p>
        </header>
        <ul v-if="jobs?.length" class="divide-y divide-[#dadce0]">
          <li v-for="job in jobs" :key="job.id"><JobsJobCard :job="job" :employer="employer!" /></li>
        </ul>
        <p v-else class="px-5 py-4 text-sm text-[#5f6368]">Gerade ist keine Stelle offen. Schauen Sie bald wieder vorbei.</p>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
useHead({ htmlAttrs: { class: 'font-roboto' } })
const { employer } = await useEmployer()
if (!employer.value) throw createError({ statusCode: 503, statusMessage: 'Dienst nicht konfiguriert', fatal: true })
const { data: jobs } = await useJobs()
useGenericPageSchema({ title: 'Offene Stellen' })
useSeoMeta({
  title: () => `Offene Stellen – ${employer.value?.name}`,
  description: () => `Jobs in der Pflege bei ${employer.value?.name}: ${employer.value?.service_area ?? ''}. Bewerbung in einer Minute vom Handy.`,
})
</script>
