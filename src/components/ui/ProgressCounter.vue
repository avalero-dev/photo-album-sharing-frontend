<script setup lang="ts">
withDefaults(
  defineProps<{
    current: number
    total: number
    label?: string
  }>(),
  {
    label: 'fotos',
  },
)
</script>

<template>
  <p class="counter-progress">
    <span class="counter value">{{ current }} / {{ total }}</span>
    <span class="label">{{ label }}</span>
  </p>
</template>

<style scoped>
.counter-progress {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
}

.value {
  font-weight: 600;
  font-size: var(--text-lg);
}

.label {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}
</style>
