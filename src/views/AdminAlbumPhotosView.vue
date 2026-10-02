<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError, adminPhotoUrl, getAlbum, type Album, type AdminPhoto } from '@/services/api'
import { usePhotosStore } from '@/stores/photos'

const route = useRoute()
const router = useRouter()
const photosStore = usePhotosStore()

const albumId = computed(() => Number(route.params.id))
const album = ref<Album | null>(null)
const loadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')

const photos = computed<AdminPhoto[]>(() => photosStore.photosByAlbum[albumId.value] ?? [])
const isLoading = computed<boolean>(() => photosStore.loading[albumId.value] === true)
const storeError = computed<string>(() => photosStore.error[albumId.value] ?? '')
const canEdit = computed(() => album.value?.status === 'DRAFT')

async function loadAlbum(): Promise<void> {
  loadError.value = ''
  try {
    album.value = await getAlbum(albumId.value)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      loadError.value = 'Álbum no encontrado'
    } else {
      loadError.value = e instanceof Error ? e.message : 'Error inesperado'
    }
  }
}

async function refresh(): Promise<void> {
  await photosStore.fetch(albumId.value)
}

async function onPick(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) {
    return
  }
  const files = Array.from(input.files)
  uploading.value = true
  uploadError.value = ''
  try {
    await photosStore.upload(albumId.value, files)
    input.value = ''
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    uploading.value = false
  }
}

async function onDelete(photo: AdminPhoto): Promise<void> {
  if (!confirm(`¿Borrar la foto "${photo.baseFilename}"?`)) {
    return
  }
  try {
    await photosStore.remove(albumId.value, photo.id)
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : 'Error inesperado'
  }
}

onMounted(async () => {
  await loadAlbum()
  await refresh()
})
</script>

<template>
  <main class="photos-view">
    <header>
      <button type="button" class="link-button" @click="router.push({ name: 'albums' })">
        ← Álbumes
      </button>
      <h1>{{ album ? album.title : 'Cargando álbum...' }}</h1>
      <p v-if="album" class="meta">
        Estado <strong>{{ album.status }}</strong> · Cuota {{ album.quota }} fotos
      </p>
    </header>

    <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>

    <section v-if="canEdit" class="upload">
      <label class="upload-label">
        Subir fotos (JPEG)
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          multiple
          :disabled="uploading"
          @change="onPick"
        />
      </label>
      <p v-if="uploading">Subiendo...</p>
      <p v-if="uploadError" class="error" role="alert">{{ uploadError }}</p>
    </section>

    <p v-if="isLoading">Cargando fotos...</p>
    <p v-else-if="storeError" class="error" role="alert">{{ storeError }}</p>
    <p v-else-if="photos.length === 0">Este álbum todavía no tiene fotos.</p>

    <ul v-else class="grid">
      <li v-for="photo in photos" :key="photo.id" class="tile">
        <img
          :src="adminPhotoUrl(albumId, photo.id, 'thumb')"
          :alt="photo.baseFilename"
          loading="lazy"
        />
        <div class="tile-body">
          <span class="filename" :title="photo.baseFilename">{{ photo.baseFilename }}</span>
          <button
            v-if="canEdit"
            type="button"
            class="delete"
            @click="onDelete(photo)"
          >
            Borrar
          </button>
        </div>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.photos-view {
  max-width: 72rem;
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

.meta {
  font-size: 0.875rem;
  color: var(--color-text);
}

.upload {
  margin: 1.5rem 0;
  padding: 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 4px;
}

.upload-label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.grid {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 1rem;
}

.tile {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-background-soft);
}

.tile img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: #f3f3f3;
}

.tile-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.filename {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete {
  border: none;
  background: none;
  color: #c62828;
  cursor: pointer;
  font-size: 0.8125rem;
}

.error {
  color: #c62828;
}
</style>
