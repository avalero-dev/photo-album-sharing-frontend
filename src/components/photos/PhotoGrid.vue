<script setup lang="ts">
import PhotoFrame from '@/components/photos/PhotoFrame.vue'

// La rejilla tipo hoja de contactos: rejilla estable, carga diferida de
// miniaturas y el único momento orquestado (dado por `animateEntry`).
export interface PhotoFrameEntry {
  id: number
  number: number
  baseFilename: string
  selected: boolean
  hasOriginal: boolean
}

withDefaults(
  defineProps<{
    photos: PhotoFrameEntry[]
    srcFor: (photo: PhotoFrameEntry) => string
    selectable?: boolean
    openable?: boolean
    busyId?: number | null
    animateEntry?: boolean
  }>(),
  {
    selectable: false,
    openable: false,
    busyId: null,
    animateEntry: false,
  },
)

defineEmits<{
  toggle: [entry: PhotoFrameEntry]
  open: [entry: PhotoFrameEntry]
  delete: [entry: PhotoFrameEntry]
}>()
</script>

<template>
  <ul class="grid">
    <PhotoFrame
      v-for="(photo, index) in photos"
      :key="photo.id"
      :class="{ animate: animateEntry }"
      :style="{ '--frame-i': index }"
      :number="photo.number"
      :src="srcFor(photo)"
      :filename="photo.baseFilename"
      :selected="photo.selected"
      :selectable="selectable"
      :openable="openable"
      :busy="busyId === photo.id"
      @toggle="$emit('toggle', photo)"
      @open="$emit('open', photo)"
    >
      <template #footer>
        <slot name="footer" :photo="photo" />
      </template>
    </PhotoFrame>
  </ul>
</template>

<style scoped>
.grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: var(--space-3);
  padding: 0;
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
    gap: var(--space-2);
  }
}

/* Único momento orquestado: aparición de miniaturas al cargar la galería (D6).
   Bajo `prefers-reduced-motion: reduce` el reset global lo anula. */
@media (prefers-reduced-motion: no-preference) {
  .grid > :deep(.frame.animate) {
    animation: frame-in 400ms ease-out both;
    animation-delay: calc(var(--frame-i, 0) * 45ms);
  }

  @keyframes frame-in {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
