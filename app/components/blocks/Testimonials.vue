<template>
  <BlockSection
    v-if="block"
    :anchor="block.anchor"
    :background="block.background"
    :padding-bottom="block.paddingBottom"
    :labelledby="block.heading ? headingId : ''">
    <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
      <BlockIntro :heading="block.heading" :heading-id="headingId" :background="block.background" />
      <ul class="grid gap-6 md:grid-cols-3">
        <li v-for="(item, i) in items" :key="i">
          <Card class="h-full">
            <CardContent>
              <blockquote class="text-base">„{{ item.quote }}“</blockquote>
            </CardContent>
            <CardFooter class="mt-auto gap-3">
              <Avatar>
                <AvatarFallback>{{ initials(item.name) }}</AvatarFallback>
              </Avatar>
              <div class="text-sm">
                <div class="font-medium">{{ item.name }}</div>
                <div v-if="item.context" class="text-muted-foreground">{{ item.context }}</div>
              </div>
            </CardFooter>
          </Card>
        </li>
      </ul>
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
const props = defineProps(blockProps)
const { data: block } = await useBlock(props)

const items = computed<any[]>(() => block.value?.items ?? [])
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
</script>
