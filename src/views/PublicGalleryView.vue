<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  ApiError,
  deselectPublicPhoto,
  finalizeSelection,
  getPublicAlbum,
  publicDownloadUrl,
  publicPhotoUrl,
  selectPublicPhoto,
  unlockAlbum,
  type PublicAlbum,
  type PublicPhoto,
} from '@/services/api'

const route = useRoute()
const token = String(route.params.token)

const album = ref<PublicAlbum | null>(null)
const loading = ref(true)
const notFound = ref(false)
const error = ref('')
const password = ref('')
const unlocking = ref(false)
const busyPhotoId = ref<number | null>(null)
const finalizing = ref(false)
const notice = ref('')
const lightboxPhoto = ref<PublicPhoto | null>(null)

const canSelect = computed(() => album.value?.status === 'SELECTING')
const isDelivering = computed(() => album.value?.status === 'DELIVERING')
const selectedCount = computed(
  () => album.value?.photos.filter((photo) => photo.selected).length ?? 0,
)

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

async function toggle(photo: PublicPhoto): Promise<void> {
  if (!album.value || !canSelect.value) {
    openLightbox(photo)
    return
  }
  error.value = ''
  notice.value = ''
  busyPhotoId.value = photo.id
  try {
    album.value = photo.selected
      ? await deselectPublicPhoto(token, photo.id)
      : await selectPublicPhoto(token, photo.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    busyPhotoId.value = null
  }
}

async function finalize(): Promise<void> {
  if (!album.value || !canSelect.value) {
    return
  }
  if (!confirm('¿Finalizar la selección? Después no podrás cambiarla.')) {
    return
  }
  error.value = ''
  notice.value = ''
  finalizing.value = true
  try {
    album.value = await finalizeSelection(token)
    notice.value = 'Tu selección quedó registrada. El fotógrafo la preparará.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error inesperado'
  } finally {
    finalizing.value = false
  }
}

function openLightbox(photo: PublicPhoto): void {
  lightboxPhoto.value = photo
}

function closeLightbox(): void {
  lightboxPhoto.value = null
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
        <p v-if="canSelect" class="meta">
          Has elegido <strong>{{ selectedCount }}</strong> de {{ album.quota }} fotos.
        </p>
        <p v-else-if="album.status === 'SELECTION_FINALIZED'" class="meta">
          Selección finalizada: {{ selectedCount }} de {{ album.quota }} fotos.
        </p>
        <p v-else-if="isDelivering" class="meta">
          Tus {{ selectedCount }} fotos seleccionadas ya están disponibles para descargar.
        </p>

        <p v-if="notice" class="notice" role="status">{{ notice }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="album.photos.length === 0">Este álbum todavía no tiene fotos.</p>

        <ul v-else class="grid">
          <li v-for="photo in album.photos" :key="photo.id" :class="{ selected: photo.selected }">
            <button
              type="button"
              class="tile"
              :disabled="canSelect && busyPhotoId === photo.id"
              :aria-pressed="canSelect ? photo.selected : undefined"
              @click="toggle(photo)"
            >
              <img
                :src="publicPhotoUrl(token, photo.id, 'thumb')"
                :alt="photo.baseFilename"
                loading="lazy"
              />
              <span v-if="photo.selected" class="check">✓</span>
            </button>
            <span class="filename">{{ photo.baseFilename }}</span>
            <div v-if="isDelivering && photo.selected" class="downloads">
              <a :href="publicDownloadUrl(token, photo.id, 'web')">Descargar web</a>
              <a v-if="photo.hasOriginal" :href="publicDownloadUrl(token, photo.id, 'original')">
                Descargar original
              </a>
            </div>
          </li>
        </ul>

        <button
          v-if="canSelect"
          type="button"
          class="finalize"
          :disabled="selectedCount === 0 || finalizing"
          @click="finalize"
        >
          {{ finalizing ? 'Enviando...' : 'Finalizar selección' }}
        </button>
      </section>
    </template>

    <div v-if="lightboxPhoto" class="lightbox" @click.self="closeLightbox">
      <button type="button" class="lightbox-close" @click="closeLightbox">×</button>
      <img
        :src="publicPhotoUrl(token, lightboxPhoto.id, 'web')"
        :alt="lightboxPhoto.baseFilename"
      />
    </div>
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

.notice {
  color: #2e7d32;
  font-size: 0.875rem;
}

.grid {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.5rem;
}

.grid li {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-background-soft);
  display: flex;
  flex-direction: column;
}

.grid li.selected {
  border-color: #2e7d32;
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.3);
}

.tile {
  position: relative;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  width: 100%;
}

.tile:disabled {
  cursor: default;
}

.grid img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: #f3f3f3;
}

.check {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #2e7d32;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.filename {
  padding: 0.5rem;
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.downloads {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0 0.5rem 0.5rem;
  font-size: 0.75rem;
}

.finalize {
  margin-top: 1.5rem;
}

.error {
  color: #c62828;
  font-size: 0.875rem;
}

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 100;
}

.lightbox img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  align-self: auto;
}
</style>
