<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError, getPublicAlbum, unlockAlbum, type PublicAlbum } from '@/services/api'

const route = useRoute()
const token = String(route.params.token)

const album = ref<PublicAlbum | null>(null)
const loading = ref(true)
const notFound = ref(false)
const error = ref('')
const password = ref('')
const unlocking = ref(false)

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    album.value = await getPublicAlbum(token)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound.value = true
    } else {
      error.value = e instanceof Error ? e.message : 'Error inesperado'
    }
  } finally {
    loading.value = false
  }
}

async function unlock(): Promise<void> {
  error.value = ''
  unlocking.value = true
  try {
    album.value = await unlockAlbum(token, password.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    unlocking.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="public">
    <p v-if="loading">Cargando...</p>
    <p v-else-if="notFound">Álbum no encontrado.</p>
    <p v-else-if="error && !album" class="error" role="alert">{{ error }}</p>

    <template v-else-if="album">
      <h1>{{ album.title }}</h1>

      <form v-if="album.requiresPassword && !album.unlocked" @submit.prevent="unlock">
        <label>
          Este álbum está protegido. Introduce la contraseña:
          <input v-model="password" type="password" required />
        </label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button type="submit" :disabled="unlocking">
          {{ unlocking ? 'Comprobando...' : 'Entrar' }}
        </button>
      </form>

      <section v-else class="gallery">
        <p class="meta">Se entregan hasta {{ album.quota }} fotos.</p>
        <p v-if="album.photos.length === 0">Este álbum todavía no tiene fotos.</p>
        <ul v-else class="grid">
          <li v-for="photo in album.photos" :key="photo.id">{{ photo.baseFilename }}</li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.public {
  max-width: 64rem;
  margin: 2rem auto;
  padding: 0 1rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 24rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  cursor: pointer;
  align-self: flex-start;
}

.meta {
  font-size: 0.875rem;
  color: var(--color-text);
}

.grid {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.5rem;
}

.grid li {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.8125rem;
}

.error {
  color: #c62828;
  font-size: 0.875rem;
}
</style>
