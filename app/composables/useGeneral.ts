// Globale Einstellungen (general-Singleton) – einmal laden, überall nutzen (Header, Footer).
export function useGeneral() {
  const { getItems } = useDirectusItems()
  return useAsyncData('general', () => getItems({
    collection: 'general',
    params: { fields: ['*', 'logo.*', 'homepage.slug'] },
  }) as Promise<any>)
}
