<template>
  <div>
    <BlockSection background="white" padding-bottom labelledby="jobs-heading">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-8">
        <header class="space-y-4">
          <div class="space-y-1">
            <h1 id="jobs-heading" class="text-3xl font-medium leading-tight text-balance md:text-4xl">Offene Stellen bei {{ employer?.name }}</h1>
            <p v-if="employer?.service_area" class="text-sm opacity-75">{{ employer.service_area }}</p>
          </div>
          <p v-if="employer?.about" class="opacity-75">{{ employer.about }}</p>
        </header>
        <ul v-if="jobs?.length" class="mt-10 divide-y border-y">
          <li v-for="job in jobs" :key="job.id"><JobsJobCard :job="job" :employer="employer!" /></li>
        </ul>
        <p v-else class="mt-10 opacity-75">Gerade ist keine Stelle offen. Schauen Sie bald wieder vorbei.</p>
      </div>
    </BlockSection>
  </div>
</template>
<script setup lang="ts">
const { employer } = await useEmployer()
if (!employer.value) throw createError({ statusCode: 503, statusMessage: 'Dienst nicht konfiguriert', fatal: true })
const { data: jobs } = await useJobs()
useGenericPageSchema({ title: 'Offene Stellen' })
useSeoMeta({
  title: () => `Offene Stellen – ${employer.value?.name}`,
  description: () => `Jobs in der Pflege bei ${employer.value?.name}: ${employer.value?.service_area ?? ''}. Bewerbung in einer Minute vom Handy.`,
})
</script>
