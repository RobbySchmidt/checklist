// app/composables/schema/useBrandSchema.ts
// Organisation + WebSite als JSON-LD, gespeist aus der general-Singleton-Collection.
import { buildBrandEntities } from '~/utils/schema/buildBrandEntities'

export async function useBrandSchema() {
  const { getItems } = useDirectusItems()
  const config = useRuntimeConfig()
  // useSchemaRegistry nutzt useState – vor dem ersten await auflösen (braucht den Nuxt-Kontext)
  const registry = useSchemaRegistry({ scope: 'layout' })

  const { data } = await useAsyncData('schema:brand', async () => {
    const general = await getItems({
      collection: 'general',
      params: {
        fields: ['logo', 'address', 'phone', 'email', 'social_profiles'],
      },
    }) as any
    return { general }
  })

  if (!data.value?.general) return

  const entities = buildBrandEntities({
    general: data.value.general,
    siteUrl: config.public.siteUrl as string,
    siteName: config.public.siteName as string,
    assetBaseUrl: `${config.public.directusUrl}/assets`,
  })
  registry.addMany(entities)
}
