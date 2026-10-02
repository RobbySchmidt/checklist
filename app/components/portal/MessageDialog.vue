<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ kind === 'invite' ? 'Einladung' : 'Absage' }} an {{ application.name }}</DialogTitle>
        <DialogDescription>Text anpassen und über den gewünschten Weg senden.</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4">
        <div class="grid gap-1">
          <label for="msg-text" class="text-sm font-medium">Nachricht</label>
          <textarea id="msg-text" v-model="text" rows="10" class="rounded-lg border border-border px-4 py-3 text-base" />
          <p class="text-sm opacity-75">Sie versenden die Nachricht selbst. Das Portal verschickt nichts an Bewerber.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a :href="waHref" target="_blank" rel="noopener" class="inline-flex h-12 items-center rounded-full bg-primary px-5 font-medium text-primary-foreground">Per WhatsApp</a>
          <a v-if="application.email" :href="mailHref" class="inline-flex h-12 items-center rounded-full border border-border px-5 font-medium">Als E-Mail</a>
          <button type="button" class="h-12 rounded-full border border-border px-5 font-medium" @click="copy">{{ copied ? 'Kopiert' : 'Text kopieren' }}</button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { fillTemplate, DEFAULT_TEMPLATE_INVITE, DEFAULT_TEMPLATE_REJECT } from '#shared/utils/templates'
import { normalizePhone } from '#shared/utils/applicationSchema'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const props = defineProps<{ kind: 'invite' | 'reject'; application: any; employer: any }>()
const open = defineModel<boolean>('open', { default: false })
const copied = ref(false)
const text = ref('')

function build() {
  const e = props.employer || {}
  const tpl = (props.kind === 'invite' ? e.template_invite || DEFAULT_TEMPLATE_INVITE : e.template_reject || DEFAULT_TEMPLATE_REJECT) as string
  return fillTemplate(tpl, { name: props.application.name || '', stelle: props.application.job?.title || '', dienst: e.name || '', ansprechperson: props.application.job?.contact_name || '', telefon: e.phone || '' })
}
watch([open, () => props.kind, () => props.application?.id], () => { if (open.value) { text.value = build(); copied.value = false } }, { immediate: true })

const subject = computed(() => `Ihre Bewerbung bei ${props.employer?.name ?? ''}`)
const waHref = computed(() => `https://wa.me/${normalizePhone(props.application.phone || '').replace(/^\+/, '')}?text=${encodeURIComponent(text.value)}`)
const mailHref = computed(() => `mailto:${props.application.email}?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(text.value)}`)

async function copy() {
  try { await navigator.clipboard.writeText(text.value) } catch {
    const ta = document.getElementById('msg-text') as HTMLTextAreaElement | null
    ta?.select()
    try { document.execCommand('copy') } catch { /* nicht möglich */ }
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>
