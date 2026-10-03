<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ApiError,
  adminPhotoUrl,
  getAlbum,
  openAlbumDelivery,
  uploadAdminOriginals,
  type Album,
  type AdminPhoto,
} from '@/services/api'
import { usePhotosStore } from '@/stores/photos'

const route = useRoute()
const router = useRouter()
const photosStore = usePhotosStore()

const albumId = computed(() => Number(route.params.id))
const album = ref<Album | null>(null)
const loadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const originalInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadingOriginals = ref(false)
const openingDelivery = ref(false)
const uploadError = ref('')
const originalError = ref('')
const deliveryError = ref('')
const notice = ref('')

const photos = computed<AdminPhoto[]>(() => photosStore.photosByAlbum[albumId.value] ?? [])
const isLoading = computed<boolean>(() => photosStore.loading[albumId.value] === true)
const storeError = computed<string>(() => photosStore.error[albumId.value] ?? '')
const canEdit = computed(() => album.value?.status === 'DRAFT')
const canUploadOriginals = computed(
  () => album.value?.status === 'SELECTION_FINALIZED' || album.value?.status === 'DELIVERING',
)
const canOpenDelivery = computed(() => album.value?.status === 'SELECTION_FINALIZED')
const selectedPhotos = computed(() => photos.value.filter((photo) => photo.selectedAt !== null))

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

async function onPickOriginals(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) {
    return
  }
  const files = Array.from(input.files)
  uploadingOriginals.value = true
  originalError.value = ''
  notice.value = ''
  try {
    const result = await uploadAdminOriginals(albumId.value, files)
    await refresh()
    const parts = [`${result.uploaded} original(es) asociado(s)`]
    if (result.unmatched > 0) {
      parts.push(`${result.unmatched} sin coincidencia: ${result.unmatchedFilenames.join(', ')}`)
    }
    notice.value = parts.join(' · ')
    input.value = ''
  } catch (e) {
    originalError.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    uploadingOriginals.value = false
  }
}

async function openDelivery(): Promise<void> {
  if (!confirm('¿Abrir la entrega? El cliente podrá descargar las fotos seleccionadas.')) {
    return
  }
  openingDelivery.value = true
  deliveryError.value = ''
  notice.value = ''
  try {
    album.value = await openAlbumDelivery(albumId.value)
    notice.value = 'Entrega abierta: el cliente ya puede descargar.'
  } catch (e) {
    deliveryError.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    openingDelivery.value = false
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
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

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

    <section v-if="album && album.status !== 'DRAFT'" class="selection">
      <h2>Selección finalizada ({{ selectedPhotos.length }} / {{ album.quota }})</h2>
      <p v-if="selectedPhotos.length === 0">El cliente todavía no ha seleccionado fotos.</p>
      <ul v-else class="selection-list">
        <li v-for="photo in selectedPhotos" :key="photo.id">
          <span class="filename" :title="photo.baseFilename">{{ photo.baseFilename }}</span>
          <span :class="['orig', photo.originalKey ? 'ok' : 'pending']">
            {{ photo.originalKey ? 'Con original' : 'Pendiente' }}
          </span>
        </li>
      </ul>

      <div v-if="canOpenDelivery" class="delivery-actions">
        <button type="button" :disabled="openingDelivery" @click="openDelivery">
          {{ openingDelivery ? 'Abriendo...' : 'Abrir entrega' }}
        </button>
        <p v-if="deliveryError" class="error" role="alert">{{ deliveryError }}</p>
      </div>
    </section>

    <section v-if="canUploadOriginals" class="upload">
      <label class="upload-label">
        Subir originales de las fotos seleccionadas
        <input
          ref="originalInput"
          type="file"
          multiple
          :disabled="uploadingOriginals"
          @change="onPickOriginals"
        />
      </label>
      <p v-if="uploadingOriginals">Subiendo originales...</p>
      <p v-if="originalError" class="error" role="alert">{{ originalError }}</p>
    </section>

    <p v-if="isLoading">Cargando fotos...</p>
    <p v-else-if="storeError" class="error" role="alert">{{ storeError }}</p>
    <p v-else-if="photos.length === 0">Este álbum todavía no tiene fotos.</p>

    <ul v-else class="grid">
      <li v-for="photo in photos" :key="photo.id" class="tile" :class="{ selected: photo.selectedAt }">
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
        <div v-if="album && album.status !== 'DRAFT'" class="badges">
          <span v-if="photo.selectedAt" class="badge selected-badge">Seleccionada</span>
          <span v-if="photo.originalKey" class="badge ok-badge">Original</span>
          <span v-else-if="photo.selectedAt" class="badge pending-badge">Pendiente</span>
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

.selection {
  margin: 1.5rem 0;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.selection h2 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.selection-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.selection-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
}

.orig {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
}

.orig.ok {
  background: rgba(46, 125, 50, 0.15);
  color: #2e7d32;
}

.orig.pending {
  background: rgba(198, 40, 40, 0.12);
  color: #c62828;
}

.delivery-actions {
  margin-top: 1rem;
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

.tile.selected {
  border-color: #2e7d32;
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

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0 0.5rem 0.5rem;
}

.badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.4rem;
  border-radius: 999px;
}

.selected-badge {
  background: rgba(46, 125, 50, 0.15);
  color: #2e7d32;
}

.ok-badge {
  background: rgba(21, 101, 192, 0.15);
  color: #1565c0;
}

.pending-badge {
  background: rgba(198, 40, 40, 0.12);
  color: #c62828;
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

.notice {
  color: #2e7d32;
  font-size: 0.875rem;
}

.error {
  color: #c62828;
}
</style>
