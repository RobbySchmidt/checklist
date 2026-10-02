import { defineStore } from 'pinia'

export const useStore = defineStore('store', {
  state: () => ({
    menuOpen: false,
    openSubMenuId: null as number | string | null,
  }),
})
