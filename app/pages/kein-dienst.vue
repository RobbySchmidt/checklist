<template>
  <div class="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 class="text-2xl font-bold">Kein Dienst für diese Adresse</h1>
    <p class="mt-3 text-muted-foreground">Unter dieser Adresse ist noch kein Pflegedienst eingerichtet.</p>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'bare' })
useSeoMeta({ title: 'Kein Dienst', robots: 'noindex' })
</script>
