<script setup lang="ts">
// Marcador de estado: texto + forma, nunca solo color (design D6).
// Los estados de álbum llegan como enum del API; el texto siempre es legible.
defineProps<{
  tone: 'neutral' | 'accent' | 'ready' | 'danger'
  text: string
}>()
</script>

<template>
  <span class="marker" :data-tone="tone">
    <span class="dot" aria-hidden="true"></span>
    <span class="text">{{ text }}</span>
  </span>
</template>

<style scoped>
.marker {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.125rem 0.5rem;
  font-size: var(--text-xs);
  line-height: var(--lh-snug);
  color: var(--color-ink);
  background: var(--color-surface);
  border: var(--hairline) solid var(--color-line);
  border-radius: var(--radius-pill);
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  flex: none;
  border-radius: var(--radius-pill);
  background: var(--color-line);
}

.marker[data-tone='accent'] .dot {
  background: var(--color-accent);
}

.marker[data-tone='ready'] {
  color: var(--color-ready);
  background: var(--color-ready-soft);
  border-color: transparent;
}

.marker[data-tone='ready'] .dot {
  background: var(--color-ready);
}

.marker[data-tone='danger'] {
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-color: transparent;
}

.marker[data-tone='danger'] .dot {
  background: var(--color-danger);
}
</style>
