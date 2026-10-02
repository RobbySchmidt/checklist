<template><div /></template>
<script setup lang="ts">
import type { Job, Employer } from '#shared/utils/jobs'
defineProps<{ job: Job; employer: Employer }>()
</script>
