import { ref } from 'vue'
import { listNotifications, markNotificationRead, type Notification } from '@/services/api'

// Estado compartido a nivel de módulo: el shell (contador del rail) y la
// vista de notificaciones leen y escriben el mismo estado — tareas 3.1 y 4.5.

const items = ref<Notification[]>([])
const unread = ref(0)
const loading = ref(false)
const error = ref('')
const busyId = ref<string | null>(null)

export function useNotifications() {
  async function load(): Promise<void> {
    error.value = ''
    loading.value = true
    try {
      const inbox = await listNotifications()
      items.value = inbox.items
      unread.value = inbox.unread
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
      unread.value = Math.max(0, unread.value - 1)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      busyId.value = null
    }
  }

  return { items, unread, loading, error, busyId, load, markRead }
}
