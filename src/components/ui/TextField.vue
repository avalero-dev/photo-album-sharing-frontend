<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    label: string
    modelValue?: string | number
    type?: string
    required?: boolean
    min?: string | number
    maxLength?: number
    autocomplete?: string
    hint?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    type: 'text',
    required: false,
    disabled: false,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const hintId = `${id}-hint`

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="field">
    <label :for="id" class="field-label">
      {{ label }}
      <span v-if="required" class="required" aria-hidden="true">*</span>
    </label>
    <input
      :id="id"
      class="field-input"
      :type="type"
      :value="modelValue"
      :required="required"
      :min="min"
      :maxlength="maxLength"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :aria-describedby="hint ? hintId : undefined"
      @input="onInput"
    />
    <p v-if="hint" :id="hintId" class="field-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-ink-soft);
}

.required {
  color: var(--color-danger);
}

.field-input {
  padding: 0.5rem 0.625rem;
  font: inherit;
  color: var(--color-ink);
  background: var(--color-surface);
  border: var(--hairline) solid var(--color-line);
  border-radius: var(--radius-sm);
  transition: border-color 120ms ease;
}

.field-input:hover:not(:disabled) {
  border-color: var(--color-ink-soft);
}

.field-input:disabled {
  opacity: 0.55;
}

.field-hint {
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}
</style>
