<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: undefined,
    description: undefined,
  },
)
</script>

<template>
  <div class="empty">
    <p class="empty-title">
      <slot name="title">{{ title }}</slot>
    </p>
    <p v-if="description || $slots.default" class="empty-desc">
      <slot>{{ description }}</slot>
    </p>
    <slot name="actions" />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  border-top: var(--hairline) dashed var(--color-line);
  border-bottom: var(--hairline) dashed var(--color-line);
  text-align: center;
}

.empty-title {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-ink);
}

.empty-desc {
  max-width: 60ch;
  margin-inline: auto;
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}
</style>
