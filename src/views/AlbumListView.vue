<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { listAlbums, type Album } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const albums = ref<Album[]>([])
const error = ref('')
const loading = ref(true)

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
        <span>{{ auth.user?.email }}</span>
        <button type="button" @click="signOut">Salir</button>
      </div>
    </header>

    <div class="actions">
      <RouterLink class="button" :to="{ name: 'album-new' }">Nuevo álbum</RouterLink>
    </div>

    <p v-if="loading">Cargando...</p>
    <p v-else-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="albums.length === 0">Todavía no hay álbumes.</p>

    <table v-else>
      <thead>
        <tr>
          <th>Título</th>
          <th>Cuota</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="album in albums" :key="album.id">
          <td>{{ album.title }}</td>
          <td>{{ album.quota }}</td>
          <td><span class="status">{{ album.status }}</span></td>
          <td>
            <RouterLink :to="{ name: 'album-edit', params: { id: album.id } }">Editar</RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
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

.error {
  color: #c62828;
}
</style>
