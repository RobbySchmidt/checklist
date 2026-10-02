<template>
  <div class="min-h-screen transition duration-150 focus:outline-2 focus:outline-primary">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:rounded">
      Zum Hauptinhalt springen
    </a>
    <WebsiteHeader />
    <JobsDemoNotice />
    <main id="main-content" tabindex="-1"><slot /></main>
    <ScrollToTop><ArrowUp class="text-white" /></ScrollToTop>
    <WebsiteFooter />
    <!-- Toasts (vue-sonner), z. B. Rückmeldung des Anfrageformulars -->
    <ClientOnly><Toaster /></ClientOnly>
    <DevOnly>
      <DevToolbar />
    </DevOnly>
  </div>
</template>

<script setup>
  import { ArrowUp } from 'lucide-vue-next'

  // Organization/WebSite als JSON-LD auf jeder Seite (Layout-Scope der Schema-Registry)
  await useBrandSchema()
</script>
