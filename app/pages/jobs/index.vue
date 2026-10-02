<template>
  <div>
    <BlockSection background="white" padding-bottom labelledby="jobs-heading">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-8">
        <p v-if="employer?.service_area" class="text-sm font-medium uppercase tracking-wide opacity-75">{{ employer.service_area }}</p>
        <h1 id="jobs-heading" class="mt-2 text-3xl md:text-4xl leading-tight font-medium tracking-tight text-balance">Offene Stellen bei {{ employer?.name }}</h1>
        <p v-if="employer?.about" class="mt-4 text-base opacity-75">{{ employer.about }}</p>
        <ul v-if="jobs?.length" class="mt-8 grid gap-4">
          <li v-for="job in jobs" :key="job.id"><JobsJobCard :job="job" :employer="employer!" /></li>
        </ul>
        <p v-else class="mt-8 opacity-75">Gerade ist keine Stelle offen. Schauen Sie bald wieder vorbei.</p>
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
