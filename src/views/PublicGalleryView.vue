<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PhotoMosaic from '@/components/photos/PhotoMosaic.vue'
import type { PhotoFrameEntry } from '@/components/photos/PhotoGrid.vue'
import PhotoLightbox from '@/components/photos/PhotoLightbox.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorNotice from '@/components/ui/ErrorNotice.vue'
import ProgressCounter from '@/components/ui/ProgressCounter.vue'
import TextField from '@/components/ui/TextField.vue'
import { usePublicAlbum } from '@/composables/usePublicAlbum'
import { publicDownloadUrl, publicPhotoUrl, type PublicPhoto } from '@/services/api'

const route = useRoute()
const token = String(route.params.token)

const {
  album,
  loading,
  notFound,
  error,
  password,
  unlocking,
  photos,
  hasNext,
  photosLoading,
  photosError,
  busyPhotoId,
  finalizing,
  notice,
  lightboxPhoto,
  canSelect,
  isFinalized,
  isDelivering,
  isLocked,
  selectedCount,
  canFinalize,
  load,
  loadMore,
  unlock,
  toggle,
  finalize,
  openLightbox,
  closeLightbox,
} = usePublicAlbum(token)

load()

const entries = computed<PhotoFrameEntry[]>(() =>
  photos.value.map((photo: PublicPhoto, index: number) => ({
    id: photo.id,
    number: index + 1,
    baseFilename: photo.baseFilename,
    selected: photo.selected,
    hasOriginal: photo.hasOriginal,
    width: photo.width,
    height: photo.height,
  })),
)

function publicPhotoFor(entry: PhotoFrameEntry): PublicPhoto | undefined {
  return photos.value.find((photo) => photo.id === entry.id)
}

function srcFor(photo: PhotoFrameEntry): string {
  return publicPhotoUrl(token, photo.id, 'thumb')
}

async function onToggle(entry: PhotoFrameEntry): Promise<void> {
  const photo = publicPhotoFor(entry)
  if (photo) {
    await toggle(photo)
  }
}

function onOpen(entry: PhotoFrameEntry): void {
  const photo = publicPhotoFor(entry)
  if (photo) {
    openLightbox(photo)
  }
}

async function retryLoadMore(): Promise<void> {
  await loadMore()
}

const initialPhotosLoading = computed(
  () => album.value !== null && !isLocked.value && photos.value.length === 0 && photosLoading.value,
)

const statusSentence = computed(() => {
  if (!album.value) {
    return ''
  }
  if (canSelect.value) {
    return `Has elegido ${selectedCount.value} de ${album.value.quota} fotos.`
  }
  if (isFinalized.value) {
    return `Selección finalizada: ${selectedCount.value} de ${album.value.quota} fotos.`
  }
  if (isDelivering.value) {
    return `Tus ${selectedCount.value} fotos seleccionadas ya están disponibles para descargar.`
  }
  return ''
})

const lightboxSrc = computed(() =>
  lightboxPhoto.value ? publicPhotoUrl(token, lightboxPhoto.value.id, 'web') : '',
)
const lightboxAlt = computed(() => lightboxPhoto.value?.baseFilename ?? '')

async function onFinish(): Promise<void> {
  if (!confirm('¿Finalizar la selección? Después no podrás cambiarla.')) {
    return
  }
  await finalize()
}

// Carga incremental: el centinela al final del mosaico dispara el siguiente
// lote al entrar en el viewport. Sin controles de paginación.
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

watch(sentinel, (element) => {
  observer?.disconnect()
  observer = null
  if (element && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (observed) => {
        if (observed.some((entry) => entry.isIntersecting)) {
          void loadMore()
        }
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(element)
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <main class="gallery">
    <p v-if="loading || initialPhotosLoading" class="state-line" role="status">
      Cargando galería…
    </p>

    <EmptyState
      v-else-if="notFound"
      title="Álbum no encontrado"
      description="El enlace no existe o el álbum ya no está disponible. Pide al fotógrafo un enlace nuevo."
    />

    <ErrorNotice v-else-if="error && !album">{{ error }}</ErrorNotice>

    <template v-else-if="album">
      <header class="header">
        <h1 class="title-serif title">{{ album.title }}</h1>
        <div class="counter-line">
          <ProgressCounter
            v-if="!isLocked"
            :current="selectedCount"
            :total="album.quota"
            label="fotos"
          />
          <p v-if="statusSentence" class="sentence">{{ statusSentence }}</p>
        </div>
      </header>

      <form v-if="isLocked" class="gate" @submit.prevent="unlock">
        <p class="gate-note">Este álbum está protegido por una contraseña.</p>
        <TextField
          v-model="password"
          label="Contraseña"
          type="password"
          required
          autocomplete="current-password"
        />
        <ErrorNotice v-if="error">{{ error }}</ErrorNotice>
        <AppButton type="submit" variant="primary" :busy="unlocking">
          {{ unlocking ? 'Comprobando…' : 'Entrar' }}
        </AppButton>
      </form>

      <section v-else class="sheet">
        <ErrorNotice v-if="notice" tone="success">{{ notice }}</ErrorNotice>
        <ErrorNotice v-if="error">{{ error }}</ErrorNotice>

        <template v-if="photos.length === 0 && !photosLoading && photosError">
          <ErrorNotice>{{ photosError }}</ErrorNotice>
          <AppButton variant="secondary" @click="retryLoadMore">Reintentar</AppButton>
        </template>

        <EmptyState
          v-else-if="photos.length === 0 && !photosLoading"
          title="Este álbum todavía no tiene fotos"
          description="El fotógrafo aún no ha subido fotos para este álbum."
        />

        <template v-else>
          <PhotoMosaic
            :photos="entries"
            :src-for="srcFor"
            :selectable="canSelect"
            :openable="!canSelect"
            :busy-id="busyPhotoId"
            @toggle="onToggle"
            @open="onOpen"
          >
            <template #footer="{ photo }">
              <span v-if="isDelivering && photo.selected" class="downloads">
                <a :href="publicDownloadUrl(token, photo.id, 'web')">Descargar web</a>
                <a v-if="photo.hasOriginal" :href="publicDownloadUrl(token, photo.id, 'original')">
                  Descargar original
                </a>
              </span>
            </template>
          </PhotoMosaic>

          <div ref="sentinel" class="sentinel">
            <p v-if="photosLoading" class="state-line" role="status">Cargando más fotos…</p>
            <template v-else-if="photosError">
              <ErrorNotice>{{ photosError }}</ErrorNotice>
              <AppButton variant="secondary" @click="retryLoadMore">Reintentar</AppButton>
            </template>
            <p v-else-if="!hasNext" class="state-line" role="status">No hay más fotos.</p>
          </div>
        </template>

        <p v-if="canSelect && selectedCount === 0" class="hint">
          Marca en la hoja de contactos las fotos que quieres y finaliza tu selección.
        </p>

        <AppButton
          v-if="canSelect"
          class="finish"
          variant="primary"
          :disabled="!canFinalize"
          :busy="finalizing"
          @click="onFinish"
        >
          {{ finalizing ? 'Enviando…' : 'Finalizar selección' }}
        </AppButton>
      </section>
    </template>

    <PhotoLightbox
      v-if="lightboxPhoto"
      :src="lightboxSrc"
      :alt="lightboxAlt"
      :filename="lightboxPhoto.baseFilename"
      @close="closeLightbox"
    />
  </main>
</template>

<style scoped>
.gallery {
  max-width: 60rem;
  margin: 0 auto;
  padding: var(--space-7) var(--space-5);
}

.header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-5);
  border-bottom: var(--hairline) solid var(--color-line);
}

.title {
  font-size: var(--text-display);
  line-height: var(--lh-tight);
}

.counter-line {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.sentence {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.state-line {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.gate {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 22rem;
}

.gate-note {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.sentinel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) 0;
}

.downloads {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}

.downloads a {
  color: #fff;
}

.finish {
  align-self: flex-start;
  padding: 0.65rem 1.25rem;
  font-size: var(--text-base);
}

.hint {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

@media (max-width: 560px) {
  .gallery {
    padding: var(--space-5) var(--space-4);
  }

  .title {
    font-size: var(--text-xl);
  }

  .finish {
    align-self: stretch;
  }
}
</style>
