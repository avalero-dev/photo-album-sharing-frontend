<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PhotoFrame from '@/components/photos/PhotoFrame.vue'
import type { PhotoFrameEntry } from '@/components/photos/PhotoGrid.vue'

// Mosaico justificado (estilo tablero de colección): filas de altura fija
// cuyas anchuras son proporcionales a la relación de aspecto real de cada
// foto. Conserva el orden estable y la numeración de fotograma. La carga de
// lotes la orquesta la vista; aquí solo se compone lo ya cargado.
const props = withDefaults(
  defineProps<{
    photos: PhotoFrameEntry[]
    srcFor: (photo: PhotoFrameEntry) => string
    selectable?: boolean
    openable?: boolean
    busyId?: number | null
    targetRowHeight?: number
    gap?: number
  }>(),
  {
    selectable: false,
    openable: false,
    busyId: null,
    targetRowHeight: 220,
    gap: 8,
  },
)

defineEmits<{
  toggle: [entry: PhotoFrameEntry]
  open: [entry: PhotoFrameEntry]
}>()

const DEFAULT_ASPECT = 4 / 3

interface LayoutItem {
  photo: PhotoFrameEntry
  width: number
  height: number
  aspect: number
}

const root = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (root.value) {
    containerWidth.value = root.value.clientWidth
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        containerWidth.value = entries[0]?.contentRect.width ?? containerWidth.value
      })
      observer.observe(root.value)
    }
  }
})

onBeforeUnmount(() => observer?.disconnect())

function aspectOf(photo: PhotoFrameEntry): number {
  if (photo.width && photo.height && photo.width > 0 && photo.height > 0) {
    return photo.width / photo.height
  }
  return DEFAULT_ASPECT
}

const laidOut = computed<LayoutItem[]>(() => {
  const items = props.photos
  if (items.length === 0) {
    return []
  }
  const gap = props.gap
  const target = props.targetRowHeight
  // Reserva 1px para evitar que el redondeo haga saltar de línea la fila.
  const width = containerWidth.value > 0 ? containerWidth.value - 1 : 0

  const result: LayoutItem[] = []
  let row: { photo: PhotoFrameEntry; aspect: number }[] = []
  let aspectSum = 0

  const flush = (stretch: boolean): void => {
    if (row.length === 0) {
      return
    }
    const height =
      stretch && width > 0 && aspectSum > 0
        ? (width - gap * (row.length - 1)) / aspectSum
        : target
    for (const entry of row) {
      result.push({
        photo: entry.photo,
        aspect: entry.aspect,
        height,
        width: height * entry.aspect,
      })
    }
    row = []
    aspectSum = 0
  }

  for (const photo of items) {
    const aspect = aspectOf(photo)
    if (width > 0 && row.length > 0) {
      const projected = (aspectSum + aspect) * target + gap * row.length
      if (projected > width) {
        flush(true)
      }
    }
    row.push({ photo, aspect })
    aspectSum += aspect
  }
  flush(false)
  return result
})
</script>

<template>
  <ul ref="root" class="mosaic" :style="{ gap: `${gap}px` }">
    <PhotoFrame
      v-for="item in laidOut"
      :key="item.photo.id"
      :style="{ width: `${item.width}px`, height: `${item.height}px` }"
      :number="item.photo.number"
      :src="srcFor(item.photo)"
      :filename="item.photo.baseFilename"
      :selected="item.photo.selected"
      :selectable="selectable"
      :openable="openable"
      :busy="busyId === item.photo.id"
      :aspect="item.aspect"
      :overlay="true"
      @toggle="$emit('toggle', item.photo)"
      @open="$emit('open', item.photo)"
    >
      <template #footer>
        <slot name="footer" :photo="item.photo" />
      </template>
    </PhotoFrame>
  </ul>
</template>

<style scoped>
.mosaic {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  padding: 0;
  margin: 0;
  list-style: none;
}
</style>
