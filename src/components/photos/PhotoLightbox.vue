<script setup lang="ts">
// Visor ampliado: modal nativo → foco atrapado, cierre con Esc y teclado
// por defecto. El botón de cierre recibe el foco al abrir.
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{
  src: string
  alt: string
  filename?: string
}>()

const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement | null>(null)

function onBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

onMounted(() => {
  dialog.value?.showModal()
})

function onNativeClose(): void {
  if (dialog.value?.open) {
    dialog.value.close()
  }
  emit('close')
}

onBeforeUnmount(() => {
  if (dialog.value?.open) {
    dialog.value.close()
  }
})
</script>

<template>
  <dialog
    ref="dialog"
    class="lightbox"
    :aria-label="`Visor ampliado${filename ? `: ${filename}` : ''}`"
    @close="emit('close')"
    @click="onBackdropClick"
  >
    <button type="button" class="close" aria-label="Cerrar visor" @click="onNativeClose">×</button>
    <img :src="src" :alt="alt" :title="filename" />
  </dialog>
</template>

<style scoped>
.lightbox {
  width: calc(100vw - var(--space-6));
  height: calc(100vh - var(--space-6));
  max-width: 100vw;
  max-height: 100vh;
  padding: var(--space-6);
  background: rgb(12 14 13 / 92%);
  border: none;
  border-radius: var(--radius-md);
}

.lightbox[open] {
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox::backdrop {
  background: rgb(12 14 13 / 70%);
}

.lightbox img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 2.25rem;
  height: 2.25rem;
  font-size: 1.5rem;
  line-height: 1;
  color: #fff;
  background: none;
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.close:hover {
  background: rgb(255 255 255 / 12%);
}
</style>
