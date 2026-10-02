<template>
  <BlockSection
    v-if="block"
    :anchor="block.anchor"
    :background="block.background"
    :padding-bottom="block.paddingBottom"
    :labelledby="block.heading ? headingId : ''">
    <div class="mx-auto w-full max-w-6xl px-4 md:px-8">
      <BlockIntro :heading="block.heading" :intro="block.intro" :heading-id="headingId" :background="block.background" />
      <div class="grid gap-6 lg:grid-cols-5">
        <!-- Kontaktdaten aus „Globale Einstellungen“ -->
        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle><h3>So erreichst du uns</h3></CardTitle>
            <CardDescription v-if="general?.contact_person">{{ general.contact_person }}</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              <Item v-if="general?.address" size="sm" class="px-0">
                <ItemMedia variant="icon"><MapPin aria-hidden="true" /></ItemMedia>
                <ItemContent>
                  <ItemTitle>Adresse</ItemTitle>
                  <div class="text-sm text-muted-foreground" v-html="sanitizeHtml(general.address)" />
                </ItemContent>
              </Item>
              <Item v-if="general?.opening_hours" size="sm" class="px-0">
                <ItemMedia variant="icon"><Clock aria-hidden="true" /></ItemMedia>
                <ItemContent>
                  <ItemTitle>Öffnungszeiten</ItemTitle>
                  <ItemDescription class="line-clamp-none">{{ general.opening_hours }}</ItemDescription>
                </ItemContent>
              </Item>
              <Item v-if="general?.phone" size="sm" class="px-0">
                <ItemMedia variant="icon"><Phone aria-hidden="true" /></ItemMedia>
                <ItemContent>
                  <ItemTitle>Telefon</ItemTitle>
                  <ItemDescription><a :href="`tel:${general.phone.replace(/[^\d+]/g, '')}`">{{ general.phone }}</a></ItemDescription>
                </ItemContent>
              </Item>
              <Item v-if="general?.email" size="sm" class="px-0">
                <ItemMedia variant="icon"><Mail aria-hidden="true" /></ItemMedia>
                <ItemContent>
                  <ItemTitle>E-Mail</ItemTitle>
                  <ItemDescription><a :href="`mailto:${general.email}`">{{ general.email }}</a></ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </CardContent>
        </Card>

        <!-- Anfrageformular → POST /api/inquiry → Directus „inquiries“ -->
        <Card class="lg:col-span-3">
          <CardHeader>
            <CardTitle><h3>Anfrage schicken</h3></CardTitle>
            <CardDescription>Wir melden uns in der Regel innerhalb eines Werktags.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert v-if="sent" role="status">
              <CircleCheck aria-hidden="true" />
              <AlertTitle>Danke für deine Anfrage!</AlertTitle>
              <AlertDescription>Wir haben deine Nachricht erhalten und melden uns bei dir.</AlertDescription>
            </Alert>
            <form v-else novalidate @submit.prevent="submit">
              <FieldGroup>
                <div class="grid gap-6 sm:grid-cols-2">
                  <Field :data-invalid="!!errors.name">
                    <FieldLabel :for="`${uid}-name`">Name</FieldLabel>
                    <Input :id="`${uid}-name`" v-model="form.name" name="name" autocomplete="name" required :aria-invalid="!!errors.name" />
                    <FieldError v-if="errors.name" :errors="errors.name" />
                  </Field>
                  <Field :data-invalid="!!errors.email">
                    <FieldLabel :for="`${uid}-email`">E-Mail</FieldLabel>
                    <Input :id="`${uid}-email`" v-model="form.email" name="email" type="email" autocomplete="email" required :aria-invalid="!!errors.email" />
                    <FieldError v-if="errors.email" :errors="errors.email" />
                  </Field>
                  <Field>
                    <FieldLabel :for="`${uid}-phone`">Telefon <span class="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                    <Input :id="`${uid}-phone`" v-model="form.phone" name="phone" type="tel" autocomplete="tel" />
                  </Field>
                  <Field>
                    <FieldLabel :for="`${uid}-product`">Produkt / Anlass <span class="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                    <Input :id="`${uid}-product`" v-model="form.product" name="product" placeholder="z. B. Brautstrauß, Geburtstag" />
                  </Field>
                </div>
                <Field :data-invalid="!!errors.message">
                  <FieldLabel :for="`${uid}-message`">Nachricht</FieldLabel>
                  <Textarea :id="`${uid}-message`" v-model="form.message" name="message" rows="5" required :aria-invalid="!!errors.message" />
                  <FieldDescription>Wunschtermin, Farben, Budget – je mehr wir wissen, desto besser.</FieldDescription>
                  <FieldError v-if="errors.message" :errors="errors.message" />
                </Field>
                <Field orientation="horizontal" :data-invalid="!!errors.privacy">
                  <Checkbox :id="`${uid}-privacy`" v-model="form.privacy" name="privacy" :aria-invalid="!!errors.privacy" />
                  <FieldContent>
                    <FieldLabel :for="`${uid}-privacy`" class="font-normal">
                      <span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden. Details in der <NuxtLink to="/datenschutz" class="underline underline-offset-4">Datenschutzerklärung</NuxtLink>.</span>
                    </FieldLabel>
                    <FieldError v-if="errors.privacy" :errors="errors.privacy" />
                  </FieldContent>
                </Field>
                <!-- Honeypot gegen Bots: für Menschen unsichtbar und nicht fokussierbar -->
                <div class="hidden" aria-hidden="true">
                  <label :for="`${uid}-website`">Website</label>
                  <input :id="`${uid}-website`" v-model="form.website" name="website" type="text" tabindex="-1" autocomplete="off">
                </div>
                <Field orientation="horizontal">
                  <Button type="submit" size="lg" :disabled="pending">
                    <Spinner v-if="pending" />
                    Anfrage senden
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </BlockSection>
</template>

<script setup lang="ts">
import { CircleCheck, Clock, Mail, MapPin, Phone } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { inquirySchema } from '#shared/utils/inquirySchema'

const props = defineProps(blockProps)
const { data: block } = await useBlock(props)
const { data: general } = await useGeneral()

const uid = useId()
const route = useRoute()

const form = reactive({ name: '', email: '', phone: '', product: '', message: '', privacy: false, website: '' })
const errors = ref<Record<string, string[] | undefined>>({})
const pending = ref(false)
const sent = ref(false)

// Produktname aus „Anfragen“-Links (?produkt=…, siehe productInquiryUrl) vorausfüllen
watch(() => route.query.produkt, (value) => {
  if (typeof value === 'string' && value) form.product = value
}, { immediate: true })

async function submit() {
  const parsed = inquirySchema.safeParse(form)
  errors.value = parsed.success ? {} : parsed.error.flatten().fieldErrors
  if (!parsed.success) return

  pending.value = true
  try {
    await $fetch('/api/inquiry', { method: 'POST', body: { ...parsed.data, website: form.website } })
    sent.value = true
    toast.success('Anfrage gesendet')
  } catch (err: any) {
    if (err?.statusCode === 422 && err?.data?.data) errors.value = err.data.data
    toast.error('Das hat leider nicht geklappt', { description: 'Bitte versuch es noch einmal oder ruf uns an.' })
  } finally {
    pending.value = false
  }
}
</script>
