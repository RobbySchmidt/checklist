<template>
  <div />
</template>
<script setup lang="ts">
// Startseite leitet auf die Stellenliste um. Page-Builder und CMS-Seiten bleiben im Code, werden aber nicht mehr als Startseite genutzt.
await navigateTo('/jobs', { redirectCode: 302 })
</script>
