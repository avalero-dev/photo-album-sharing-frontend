<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    type?: 'button' | 'submit'
    disabled?: boolean
    busy?: boolean
  }>(),
  {
    variant: 'secondary',
    type: 'button',
    disabled: false,
    busy: false,
  },
)
</script>

<template>
  <button :type="type" :class="['btn', variant]" :disabled="disabled || busy">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.5rem 1rem;
  font: inherit;
  font-weight: 500;
  color: var(--color-ink);
  background: var(--color-surface);
  border: var(--hairline) solid var(--color-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.btn:hover:not(:disabled) {
  border-color: var(--color-ink-soft);
}

.primary {
  color: #fff;
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.primary:hover:not(:disabled) {
  background: var(--color-accent-strong);
  border-color: var(--color-accent-strong);
}

.danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.danger:hover:not(:disabled) {
  background: var(--color-danger-soft);
}

/* Acción de texto: sin cromo, el foco y el subrayado bastan */
.ghost {
  padding: 0.25rem 0;
  border-color: transparent;
  background: none;
  color: var(--color-accent);
}

.ghost:hover:not(:disabled) {
  color: var(--color-accent-strong);
  border-color: transparent;
  text-decoration: underline;
}

.ghost.danger {
  color: var(--color-danger);
}

.ghost.danger:hover:not(:disabled) {
  text-decoration: underline;
}
</style>
