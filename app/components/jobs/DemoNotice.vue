<template>
  <p v-if="employer?.is_demo" class="bg-[#fef3c7] text-[#92400e] text-sm text-center px-4 py-2" role="note">
    Demo-Daten, fiktiver Pflegedienst
  </p>
</template>
<script setup lang="ts">
const { employer } = await useEmployer()
</script>
