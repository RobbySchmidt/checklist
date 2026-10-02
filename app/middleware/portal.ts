export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/portal/login') return
  const { loggedIn, fetch } = useUserSession()
  if (!loggedIn.value) await fetch()
  if (!loggedIn.value) return navigateTo(`/portal/login?next=${encodeURIComponent(to.fullPath)}`)
})
