<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  listNotifications,
  markNotificationRead,
  type Notification,
} from '@/services/api'

const router = useRouter()

const items = ref<Notification[]>([])
const unreadCount = ref(0)
const loading = ref(true)
const error = ref('')
const busyId = ref<string | null>(null)

const unread = computed(() => items.value.filter((item) => !item.read).length)

const typeLabels: Record<string, string> = {
  ALBUM_PUBLISHED: 'Álbum publicado',
  SELECTION_FINALIZED: 'Selección finalizada',
  ORIGINALS_UPLOADED: 'Originales subidos',
  DELIVERY_OPENED: 'Entrega abierta',
}

function label(type: string): string {
  return typeLabels[type] ?? type
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-CL')
}

async function load(): Promise<void> {
  error.value = ''
  loading.value = true
  try {
    const inbox = await listNotifications()
    items.value = inbox.items
    unreadCount.value = inbox.unread
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    loading.value = false
  }
}

async function markRead(item: Notification): Promise<void> {
  if (item.read) {
    return
  }
  busyId.value = item.id
  error.value = ''
  try {
    await markNotificationRead(item.id)
    item.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>

<template>
  <main class="notifications">
    <header>
      <button type="button" class="link-button" @click="router.push({ name: 'albums' })">
        ← Álbumes
      </button>
      <h1>Notificaciones</h1>
      <p v-if="unread > 0" class="badge">{{ unread }} sin leer</p>
    </header>

    <p v-if="loading">Cargando...</p>
    <p v-else-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="items.length === 0">No hay notificaciones.</p>

    <ul v-else class="list">
      <li v-for="item in items" :key="item.id" :class="{ unread: !item.read }">
        <div class="body">
          <span class="type">{{ label(item.type) }}</span>
          <span class="meta">Álbum #{{ item.albumId }} · {{ formatDate(item.occurredAt) }}</span>
          <RouterLink
            v-if="item.type === 'SELECTION_FINALIZED'"
            :to="{ name: 'album-photos', params: { id: item.albumId } }"
          >
            Ver álbum
          </RouterLink>
        </div>
        <button
          v-if="!item.read"
          type="button"
          class="mark"
          :disabled="busyId === item.id"
          @click="markRead(item)"
        >
          {{ busyId === item.id ? 'Marcando...' : 'Marcar como leída' }}
        </button>
        <span v-else class="read-tag">Leída</span>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.notifications {
  max-width: 48rem;
  margin: 2rem auto;
  padding: 0 1rem;
}

header {
  margin-bottom: 1.5rem;
}

.link-button {
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
}

.badge {
  display: inline-block;
  margin-top: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: #c62828;
  color: #fff;
  font-size: 0.75rem;
}

.list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background-soft);
}

.list li.unread {
  border-left: 4px solid #c62828;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.type {
  font-weight: 600;
}

.meta {
  font-size: 0.8125rem;
  color: var(--color-text);
}

.mark {
  padding: 0.375rem 0.75rem;
  cursor: pointer;
  white-space: nowrap;
}

.read-tag {
  font-size: 0.75rem;
  color: var(--color-text);
}

.error {
  color: #c62828;
}
</style>
