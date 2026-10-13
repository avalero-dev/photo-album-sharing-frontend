<script setup lang="ts">
// Diálogo de confirmación sobre <dialog> nativo (design D3, patrón de
// PhotoLightbox.vue): modal con foco atrapado, backdrop y cierre con Esc
// gratis. El botón de confirmar recibe el foco al abrir (autofocus).
// El flujo vive en el padre: la vista declara el diálogo con v-if y captura
// el objetivo pendiente; aquí solo se emite `confirm` o `cancel` una vez.
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

withDefaults(
  defineProps<{
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
  }>(),
  {
    confirmLabel: 'Confirmar',
    danger: false,
  },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const titleId = useId()
const messageId = useId()

const dialog = ref<HTMLDialogElement | null>(null)
let settled = false

function onConfirm(): void {
  settled = true
  emit('confirm')
}

function onCancel(): void {
  settled = true
  emit('cancel')
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    onCancel()
  }
}

onMounted(() => {
  dialog.value?.showModal()
})

onBeforeUnmount(() => {
  if (dialog.value?.open) {
    dialog.value.close()
  }
})
</script>

<template>
  <dialog
    ref="dialog"
    class="confirm"
    :aria-labelledby="titleId"
    :aria-describedby="messageId"
    @click="onBackdropClick"
    @close="!settled && onCancel()"
  >
    <div class="panel">
      <h2 :id="titleId" class="title-serif title">{{ title }}</h2>
      <p :id="messageId" class="message">{{ message }}</p>
      <div class="actions">
        <AppButton variant="secondary" @click="onCancel">Cancelar</AppButton>
        <AppButton :variant="danger ? 'danger' : 'primary'" autofocus @click="onConfirm">
          {{ confirmLabel }}
        </AppButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.confirm {
  width: min(26rem, calc(100vw - var(--space-6)));
  /* El reset global anula el `margin: auto` del UA que centra el <dialog>
     modal; se restablece para centrarlo en ambos ejes. */
  margin: auto;
  padding: 0;
  color: var(--color-ink);
  background: var(--color-surface);
  border: var(--hairline) solid var(--color-line);
  border-radius: var(--radius-md);
}

.confirm::backdrop {
  background: rgb(12 14 13 / 40%);
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.title {
  font-size: var(--text-lg);
}

.message {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
