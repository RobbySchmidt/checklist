<template>
    <Transition>
        <button @click="scrollTop" v-if="scrollToTopActive" type="button" aria-label="zum Seitenanfang scrollen" ref="scrollTopButton"
        class="fixed z-30 flex items-center justify-center w-12 h-12 text-4xl text-black rounded-full transition drop-shadow-xl bg-black bottom-5 right-5 hover:drop-shadow-xl lg:cursor-pointer"><slot /></button>
    </Transition>
</template>
<script setup lang="ts">
  const scrollTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  const { isScrolled: scrollToTopActive } = useScrollActive()
</script>
<style>
  .v-enter-active,
  .v-leave-active {
    transition: opacity 0.5s ease;
  }
  .v-enter-from,
  .v-leave-to {
    opacity: 0;
  }
</style>
