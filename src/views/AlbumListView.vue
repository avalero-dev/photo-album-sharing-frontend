<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { listAlbums, listNotifications, publishAlbum, type Album } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const albums = ref<Album[]>([])
const error = ref('')
const loading = ref(true)
const unreadNotifications = ref(0)
const busyAlbumId = ref<number | null>(null)
const actionError = ref('')
const copiedAlbumId = ref<number | null>(null)

async function load(): Promise<void> {
  error.value = ''
  loading.value = true
  try {
    albums.value = await listAlbums()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    loading.value = false
  }
  try {
    unreadNotifications.value = (await listNotifications()).unread
  } catch {
    unreadNotifications.value = 0
  }
}

async function publish(album: Album): Promise<void> {
  busyAlbumId.value = album.id
  actionError.value = ''
  try {
    await publishAlbum(album.id)
    await load()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    busyAlbumId.value = null
  }
}

function publicAlbumPath(album: Album): string {
  return `/a/${album.token}`
}

async function copyLink(album: Album): Promise<void> {
  const url = `${window.location.origin}${publicAlbumPath(album)}`
  try {
    await navigator.clipboard.writeText(url)
    copiedAlbumId.value = album.id
    window.setTimeout(() => {
      if (copiedAlbumId.value === album.id) {
        copiedAlbumId.value = null
      }
    }, 1500)
  } catch {
    window.prompt('Copia el enlace público:', url)
  }
}

async function signOut(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}

onMounted(load)
</script>

<template>
  <main class="albums">
    <header>
      <h1>Álbumes</h1>
      <div class="session">
        <RouterLink :to="{ name: 'notifications' }">
          Notificaciones
          <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
        </RouterLink>
        <span>{{ auth.user?.email }}</span>
        <button type="button" @click="signOut">Salir</button>
      </div>
    </header>

    <div class="actions">
      <RouterLink class="button" :to="{ name: 'album-new' }">Nuevo álbum</RouterLink>
    </div>

    <p v-if="loading">Cargando...</p>
    <p v-else-if="error" class="error" role="alert">{{ error }}</p>

    <template v-else>
      <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>
      <p v-if="albums.length === 0">Todavía no hay álbumes.</p>

      <table v-else>
        <thead>
          <tr>
            <th>Título</th>
            <th>Cuota</th>
            <th>Estado</th>
            <th>Enlace público</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="album in albums" :key="album.id">
            <td>{{ album.title }}</td>
            <td>{{ album.quota }}</td>
            <td><span class="status">{{ album.status }}</span></td>
            <td>
              <template v-if="album.status !== 'DRAFT'">
                <a
                  class="public-link"
                  :href="publicAlbumPath(album)"
                  target="_blank"
                  rel="noopener"
                  :title="publicAlbumPath(album)"
                >
                  {{ publicAlbumPath(album) }}
                </a>
                <button type="button" class="link-button" @click="copyLink(album)">
                  {{ copiedAlbumId === album.id ? 'Copiado' : 'Copiar' }}
                </button>
              </template>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <div class="row-actions">
                <RouterLink :to="{ name: 'album-photos', params: { id: album.id } }">Fotos</RouterLink>
                <RouterLink :to="{ name: 'album-edit', params: { id: album.id } }">Editar</RouterLink>
                <button
                  v-if="album.status === 'DRAFT'"
                  type="button"
                  class="link-button"
                  :disabled="busyAlbumId === album.id"
                  @click="publish(album)"
                >
                  {{ busyAlbumId === album.id ? 'Publicando...' : 'Publicar' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </main>
</template>

<style scoped>
.albums {
  max-width: 60rem;
  margin: 2rem auto;
  padding: 0 1rem;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.badge {
  display: inline-block;
  min-width: 1.1rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: #c62828;
  color: #fff;
  font-size: 0.6875rem;
  text-align: center;
}

.actions {
  margin: 1rem 0;
}

.button {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  text-decoration: none;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.status {
  font-family: monospace;
  font-size: 0.8125rem;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.public-link {
  display: inline-block;
  max-width: 16rem;
  margin-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.muted {
  color: var(--color-text);
  opacity: 0.5;
}

.link-button {
  border: none;
  background: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
}

.link-button:disabled {
  opacity: 0.6;
  cursor: default;
}

.error {
  color: #c62828;
}
</style>
