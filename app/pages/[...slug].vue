<template>
  <div>
     <NuxtErrorBoundary>
      <!-- Render the page using the PageBuilder component -->
       <WebsiteContentBlockBuilder :blocks="page.blocks" v-if="page && page.blocks" />
      <!-- If there is an error, display it using the VAlert component -->
      <template #error="{ error }">
        <div>
          <div type="error">{{ error.statusMessage }}</div>
        </div>
      </template>
    </NuxtErrorBoundary>
  </div>
</template>

<script setup>
 const { getItems } = useDirectusItems()
 const { public: pub}  = useRuntimeConfig()

  const { params, path } = useRoute()

  function getSlug() {
    if (path == '/') {
      return 'home'
    } else return params.slug[0]
  }



  const {
    data: page,
    pending: pendingPage,
    error: errorPage,
  } = await useAsyncData( path, () => {
      return getItems({      
          collection: "pages",      
          params: { 
            filter: {
              status: {
                _eq: "published"
              },
              slug: { _eq: getSlug() },
            },
            fields: ['*', 'seo.*', 'blocks.collection' , 'blocks.item.id'],
            
          },    
        })
    },
    {
      transform: (data) => data?.[0] ?? null,
    }

  )

  if (!page.value) {
    throw createError({ statusCode: 404, statusMessage: 'Page Not Found' })
  }

  useGenericPageSchema(page)

  useSeoMeta({
    title: () => page.value?.seo?.title ?? pub.siteName,
    description: () => page.value?.seo?.meta_description ?? pub.siteName,
    ogTitle: () => page.value?.seo?.title ?? pub.siteName,
    ogDescription: () => page.value?.seo?.meta_description ?? pub.siteName,
    ogUrl: () => pub.siteUrl + path,
    robots: () => {
      if(!page.value?.seo) return 'noindex, nofollow'
      const {no_index, no_follow } = page.value.seo
      return `${no_index ? 'noindex' : 'index'}, ${no_follow ? 'nofollow' : 'follow'}`
    }
  })

</script>