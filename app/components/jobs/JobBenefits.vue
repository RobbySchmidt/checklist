<template>
  <section v-if="benefits.length || employer.schedule_model" aria-labelledby="benefits-heading" class="grid gap-4">
    <h2 id="benefits-heading" class="text-2xl font-bold">So arbeiten wir</h2>
    <p v-if="employer.schedule_model" class="rounded-xl border border-border p-4"><span class="font-semibold">Dienstplan:</span> {{ employer.schedule_model }}</p>
    <ul v-if="benefits.length" class="grid gap-2 sm:grid-cols-2">
      <li v-for="b in benefits" :key="b.label" class="rounded-xl bg-secondary p-4">
        <p class="font-semibold">{{ b.label }}</p>
        <p v-if="b.detail" class="text-sm text-muted-foreground">{{ b.detail }}</p>
      </li>
    </ul>
    <p v-if="job.contact_name" class="text-muted-foreground">Ansprechperson: {{ job.contact_name }}<span v-if="employer.phone"> · {{ employer.phone }}</span></p>
  </section>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { jobBenefits } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer }>()
const benefits = computed(() => jobBenefits(props.job, props.employer))
</script>
