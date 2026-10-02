<template>
  <section v-if="benefits.length || employer.schedule_model" aria-labelledby="benefits-heading" class="grid gap-3 border-t border-[#dadce0] p-5">
    <h2 id="benefits-heading" class="text-base font-medium">So arbeiten wir</h2>
    <p v-if="employer.schedule_model" class="text-sm"><span class="font-medium">Dienstplan:</span> {{ employer.schedule_model }}</p>
    <ul v-if="benefits.length" class="divide-y divide-[#dadce0] border-y border-[#dadce0]">
      <li v-for="b in benefits" :key="b.label" class="py-3">
        <p class="text-sm font-medium">{{ b.label }}</p>
        <p v-if="b.detail" class="text-sm text-[#5f6368]">{{ b.detail }}</p>
      </li>
    </ul>
    <p v-if="job.contact_name" class="text-sm text-[#5f6368]">Ansprechperson: {{ job.contact_name }}<span v-if="employer.phone"> · {{ employer.phone }}</span></p>
  </section>
</template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
import { jobBenefits } from '#shared/utils/jobs'
const props = defineProps<{ job: Job; employer: Employer }>()
const benefits = computed(() => jobBenefits(props.job, props.employer))
</script>
