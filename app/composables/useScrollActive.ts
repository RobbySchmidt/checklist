import { useWindowScroll } from '@vueuse/core'

export function useScrollActive() {
  const isScrolled = ref(false)
  const { y } = useWindowScroll()

  watch(y, (value) => {
    isScrolled.value = value > 0
  })

  return { isScrolled }
}
