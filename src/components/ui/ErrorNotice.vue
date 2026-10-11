<script setup lang="ts">
// Mensaje unificado de error (alert) o éxito (status) — design D8.
withDefaults(
  defineProps<{
    tone?: 'error' | 'success'
  }>(),
  {
    tone: 'error',
  },
)
</script>

<template>
  <p :class="['notice', tone]" :role="tone === 'error' ? 'alert' : 'status'">
    <slot />
  </p>
</template>

<style scoped>
.notice {
  max-width: 75ch;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  border-left: 3px solid;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-left-color: var(--color-danger);
}

.success {
  color: var(--color-ready);
  background: var(--color-ready-soft);
  border-left-color: var(--color-ready);
}
</style>
