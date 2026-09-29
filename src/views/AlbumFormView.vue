<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createAlbum, listAlbums, updateAlbum, type AlbumInput } from '@/services/api'

const route = useRoute()
const router = useRouter()

const albumId = route.params.id ? Number(route.params.id) : null
const title = ref('')
const quota = ref<number>(10)
const password = ref('')
const error = ref('')
const loading = ref(albumId !== null)
const submitting = ref(false)

onMounted(async () => {
  if (albumId === null) {
    return
  }
  try {
    const album = (await listAlbums()).find((candidate) => candidate.id === albumId)
    if (album) {
      title.value = album.title
      quota.value = album.quota
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    loading.value = false
  }
})

async function submit(): Promise<void> {
  error.value = ''
  submitting.value = true
  try {
    const input: AlbumInput = { title: title.value, quota: quota.value }
    if (password.value !== '') {
      input.password = password.value
    }
    if (albumId === null) {
      await createAlbum(input)
    } else {
      await updateAlbum(albumId, input)
    }
    await router.push({ name: 'albums' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="album-form">
    <h1>{{ albumId === null ? 'Nuevo álbum' : 'Editar álbum' }}</h1>

    <p v-if="loading">Cargando...</p>
    <form v-else @submit.prevent="submit">
      <label>
        Título
        <input v-model="title" type="text" required maxlength="255" />
      </label>
      <label>
        Cuota de fotos elegibles
        <input v-model.number="quota" type="number" min="1" required />
      </label>
      <label>
        Contraseña (opcional)
        <input v-model="password" type="password" autocomplete="new-password" />
      </label>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <div class="buttons">
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Guardando...' : 'Guardar' }}
        </button>
        <RouterLink :to="{ name: 'albums' }">Cancelar</RouterLink>
      </div>
    </form>
  </main>
</template>

<style scoped>
.album-form {
  max-width: 24rem;
  margin: 2rem auto;
  padding: 0 1rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.error {
  color: #c62828;
  font-size: 0.875rem;
}
</style>
