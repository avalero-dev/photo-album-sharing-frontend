<script setup lang="ts">
import { computed } from 'vue'

// Una celda de la hoja de contactos: miniatura con número de fotograma.
// La numeración codifica el orden real y estable de las fotos del álbum.
const props = withDefaults(
  defineProps<{
    number: number
    src: string
    filename: string
    selected?: boolean
    selectable?: boolean
    openable?: boolean
    busy?: boolean
    aspect?: number | null
    overlay?: boolean
  }>(),
  {
    selected: false,
    selectable: false,
    openable: false,
    busy: false,
    aspect: null,
    overlay: false,
  },
)

defineEmits<{
  toggle: []
  open: []
}>()

const frameNumber = computed(() => String(props.number).padStart(2, '0'))

const imageStyle = computed(() =>
  !props.overlay && props.aspect ? { aspectRatio: String(props.aspect) } : undefined,
)
</script>

<template>
  <li class="frame" :class="{ selected, 'frame--overlay': overlay }">
    <button
      v-if="selectable"
      type="button"
      class="frame-hit"
      :aria-pressed="selected"
      :aria-label="`Foto ${number}: ${filename}${selected ? ' (elegida)' : ''}`"
      :disabled="busy"
      @click="$emit('toggle')"
    >
      <img :src="src" :alt="`Foto ${number} — ${filename}`" :style="imageStyle" loading="lazy" />
      <span class="frame-no counter" aria-hidden="true">{{ frameNumber }}</span>
      <span v-if="selected" class="frame-check" aria-hidden="true">✓</span>
    </button>

    <button
      v-else-if="openable"
      type="button"
      class="frame-hit"
      :aria-label="`Ampliar la foto ${number}: ${filename}`"
      @click="$emit('open')"
    >
      <img :src="src" :alt="`Foto ${number} — ${filename}`" :style="imageStyle" loading="lazy" />
      <span class="frame-no counter" aria-hidden="true">{{ frameNumber }}</span>
    </button>

    <div v-else class="frame-hit static">
      <img :src="src" :alt="`Foto ${number} — ${filename}`" :style="imageStyle" loading="lazy" />
      <span class="frame-no counter" aria-hidden="true">{{ frameNumber }}</span>
      <span v-if="selected" class="frame-check" aria-hidden="true">✓</span>
    </div>

    <p class="filename" :title="filename">{{ filename }}</p>

    <div v-if="$slots.footer" class="footer">
      <slot name="footer" />
    </div>
  </li>
</template>

<style scoped>
.frame {
  position: relative;
  background: var(--color-surface);
  border: var(--hairline) solid var(--color-line);
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;
}

.frame.selected {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.frame-hit {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.frame-hit.static {
  cursor: default;
}

.frame-hit:disabled {
  cursor: wait;
}

.frame img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: var(--color-line);
}

.frame-no {
  position: absolute;
  top: 0.375rem;
  left: 0.375rem;
  padding: 0 0.4rem;
  font-size: var(--text-xs);
  line-height: 1.375rem;
  color: var(--color-ink);
  background: var(--color-surface);
  border: var(--hairline) solid var(--color-line);
  border-radius: var(--radius-pill);
}

.frame-check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.875rem;
  color: #fff;
  background: var(--color-accent);
  border-radius: var(--radius-pill);
}

.filename {
  overflow: hidden;
  padding: var(--space-2) var(--space-2) 0;
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--space-1) var(--space-2) var(--space-2);
}

/* Modo mosaico: la celda es la caja calculada por el padre; la imagen la
   rellena y el pie/numeración se superponen sin alterar la altura. */
.frame--overlay {
  height: 100%;
  overflow: hidden;
}

.frame--overlay .frame-hit,
.frame--overlay .frame-hit.static {
  height: 100%;
}

.frame--overlay img {
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
  object-fit: cover;
}

.frame--overlay .filename {
  display: none;
}

.frame--overlay .footer {
  position: absolute;
  inset: auto 0 0 0;
  padding: var(--space-2);
  background: linear-gradient(to top, rgb(12 14 13 / 62%), transparent);
}
</style>
