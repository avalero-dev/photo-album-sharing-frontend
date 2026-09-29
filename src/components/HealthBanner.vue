<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchHealth } from '@/services/api'

type Status = 'loading' | 'up' | 'down'

const status = ref<Status>('loading')
const detail = ref('checking...')

onMounted(async () => {
  try {
    const health = await fetchHealth()
    status.value = health.status === 'UP' ? 'up' : 'down'
    detail.value = `${health.service}: ${health.status}`
  } catch (error) {
    status.value = 'down'
    detail.value = error instanceof Error ? error.message : 'unknown error'
  }
})
</script>

<template>
  <p class="health" :data-status="status">
    API <strong>{{ status }}</strong> — {{ detail }}
  </p>
</template>

<style scoped>
.health {
  font-size: 12px;
  text-align: center;
}

.health[data-status='up'] strong {
  color: #2e7d32;
}

.health[data-status='down'] strong {
  color: #c62828;
}
</style>
