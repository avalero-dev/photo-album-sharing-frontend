<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { PhotoFrameEntry } from '@/components/photos/PhotoGrid.vue'
import PhotoGrid from '@/components/photos/PhotoGrid.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorNotice from '@/components/ui/ErrorNotice.vue'
import ProgressCounter from '@/components/ui/ProgressCounter.vue'
import StatusMarker from '@/components/ui/StatusMarker.vue'
import { useAlbumPhotos } from '@/composables/useAlbumPhotos'
import { adminPhotoUrl, type AdminPhoto } from '@/services/api'
import { albumStatusLabel, albumStatusTone } from '@/lib/albumStatus'

const route = useRoute()
const albumId = Number(route.params.id)

const {
  album,
  albumError,
  photos,
  isLoadingPhotos,
  photosError,
  uploading,
  uploadingOriginals,
  openingDelivery,
  selectedPhotos,
  canEdit,
  canShowSelection,
  canUploadOriginals,
  canOpenDelivery,
  refresh,
  upload,
  uploadOriginals,
  openDelivery,
  deletePhoto,
  init,
} = useAlbumPhotos(albumId)

const entries = computed<PhotoFrameEntry[]>(() =>
  photos.value.map((photo: AdminPhoto) => ({
    id: photo.id,
    number: photo.position,
    baseFilename: photo.baseFilename,
    selected: photo.selectedAt !== null,
    hasOriginal: photo.originalKey !== null,
  })),
)

function srcFor(photo: PhotoFrameEntry): string {
  return adminPhotoUrl(albumId, photo.id, 'thumb')
}

function photoFor(entry: PhotoFrameEntry): AdminPhoto | undefined {
  return photos.value.find((photo) => photo.id === entry.id)
}

async function onPickWebUploads(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) {
    return
  }
  const files = Array.from(input.files)
  await upload(files)
  input.value = ''
}

async function onPickOriginals(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) {
    return
  }
  const files = Array.from(input.files)
  await uploadOriginals(files)
  input.value = ''
}

// Confirmaciones con diálogo nativo (design D3): la vista captura el objetivo
// pendiente y el diálogo decide si la acción continúa.
const pendingDelete = ref<AdminPhoto | null>(null)
const deliveryConfirmation = ref(false)

function onDeletePhoto(entry: PhotoFrameEntry): void {
  const photo = photoFor(entry)
  if (photo) {
    pendingDelete.value = photo
  }
}

async function confirmDeletePhoto(): Promise<void> {
  const photo = pendingDelete.value
  pendingDelete.value = null
  if (photo) {
    await deletePhoto(photo.id)
  }
}

function onOpenDelivery(): void {
  deliveryConfirmation.value = true
}

async function confirmOpenDelivery(): Promise<void> {
  deliveryConfirmation.value = false
  await openDelivery()
}

init()
</script>

<template>
  <section class="album-photos">
    <header class="page-header">
      <h1 class="title-serif page-title">{{ album ? album.title : 'Álbum' }}</h1>
      <div v-if="album" class="meta-line">
        <StatusMarker
          :tone="albumStatusTone(album.status)"
          :text="albumStatusLabel(album.status)"
        />
        <span class="counter meta-chip">Cuota {{ album.quota }} fotos</span>
      </div>
    </header>

    <ErrorNotice v-if="albumError">{{ albumError }}</ErrorNotice>

    <section v-if="canEdit" class="section">
      <h2 class="section-title">Subida web</h2>
      <p class="section-desc">Sube las fotos web (JPEG) que verá el cliente.</p>
      <div class="file-attach">
        <input
          id="upload-web"
          class="sr-only"
          type="file"
          accept="image/jpeg,.jpg,.jpeg"
          multiple
          :disabled="uploading"
          @change="onPickWebUploads"
        />
        <label class="attach-btn" for="upload-web">{{
          uploading ? 'Subiendo…' : 'Subir fotos web (JPEG)'
        }}</label>
      </div>
    </section>

    <section v-if="canShowSelection" class="section">
      <h2 class="section-title">Selección</h2>
      <ProgressCounter
        v-if="album"
        :current="selectedPhotos.length"
        :total="album.quota"
        label="fotos elegidas"
      />

      <EmptyState
        v-if="selectedPhotos.length === 0"
        title="Todavía sin elección"
        description="El cliente no ha marcado ninguna foto."
      />

      <ul v-else class="selection-list">
        <li v-for="photo in selectedPhotos" :key="photo.id" class="selection-row">
          <span class="selected-filename" :title="photo.baseFilename">{{
            photo.baseFilename
          }}</span>
          <StatusMarker v-if="photo.originalKey" tone="ready" text="Con original" />
          <StatusMarker v-else tone="neutral" text="Pendiente de original" />
        </li>
      </ul>

      <div v-if="canOpenDelivery" class="delivery">
        <AppButton variant="primary" :busy="openingDelivery" @click="onOpenDelivery">
          {{ openingDelivery ? 'Abriendo…' : 'Abrir entrega' }}
        </AppButton>
      </div>
    </section>

    <section v-if="canUploadOriginals" class="section">
      <h2 class="section-title">Originales</h2>
      <p class="section-desc">
        Sube los originales de las fotos elegidas; se emparejan por nombre base.
      </p>
      <div class="file-attach">
        <input
          id="upload-originals"
          class="sr-only"
          type="file"
          multiple
          :disabled="uploadingOriginals"
          @change="onPickOriginals"
        />
        <label class="attach-btn" for="upload-originals">
          {{ uploadingOriginals ? 'Subiendo originales…' : 'Subir originales' }}
        </label>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Hoja de contactos</h2>

      <p v-if="isLoadingPhotos" class="state-line" role="status">Cargando fotos…</p>

      <!-- El error de carga del listado es persistente y permite reintentar,
           pero no oculta las fotos ya visibles (ui-feedback: "Listado que no
           carga"). -->
      <template v-else>
        <div v-if="photosError" class="retry-line">
          <ErrorNotice>{{ photosError }}</ErrorNotice>
          <AppButton variant="secondary" @click="refresh">Reintentar</AppButton>
        </div>

        <EmptyState
          v-if="photos.length === 0 && !photosError"
          title="Este álbum todavía no tiene fotos"
          :description="
            canEdit
              ? 'Sube las fotos web para empezar a revisarlas.'
              : 'Aún no hay fotos para revisar.'
          "
        />

        <PhotoGrid
          v-if="photos.length > 0"
          :photos="entries"
          :src-for="srcFor"
          :busy-id="null"
          @delete="onDeletePhoto"
        >
          <template #footer="{ photo }">
            <span v-if="canShowSelection" class="frame-markers">
              <StatusMarker
                v-if="photo.selected && photo.hasOriginal"
                tone="ready"
                text="Con original"
              />
              <StatusMarker v-else-if="photo.selected" tone="neutral" text="Pendiente" />
            </span>
            <AppButton
              v-if="canEdit"
              variant="ghost"
              class="ghost-danger"
              @click="onDeletePhoto(photo)"
            >
              Borrar
            </AppButton>
          </template>
        </PhotoGrid>
      </template>
    </section>

    <ConfirmDialog
      v-if="pendingDelete"
      title="Borrar foto"
      :message="`¿Borrar la foto «${pendingDelete.baseFilename}»? No se puede deshacer.`"
      confirm-label="Borrar"
      danger
      @confirm="confirmDeletePhoto"
      @cancel="pendingDelete = null"
    />

    <ConfirmDialog
      v-if="deliveryConfirmation"
      title="Abrir entrega"
      message="¿Abrir la entrega? El cliente podrá descargar las fotos seleccionadas."
      confirm-label="Abrir entrega"
      @confirm="confirmOpenDelivery"
      @cancel="deliveryConfirmation = false"
    />
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.page-title {
  font-size: var(--text-xl);
}

.meta-line {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.meta-chip {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.section {
  padding: var(--space-5) 0;
  border-top: var(--hairline) solid var(--color-line);
}

.section-title {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.section-desc {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
  margin-bottom: var(--space-3);
}

.file-attach {
  display: inline-flex;
}

.attach-btn {
  display: inline-flex;
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: var(--color-ink);
  background: var(--color-surface);
  border: var(--hairline) solid var(--color-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 120ms ease;
}

.attach-btn:hover {
  border-color: var(--color-ink-soft);
}

.file-attach:focus-within .attach-btn {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.delivery {
  margin-top: var(--space-4);
}

.selection-list {
  list-style: none;
  padding: 0;
  margin: var(--space-3) 0 0;
  border-top: var(--hairline) solid var(--color-line);
}

.selection-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: var(--hairline) solid var(--color-line);
}

.selected-filename {
  overflow: hidden;
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-line {
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.retry-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.frame-markers {
  display: flex;
  flex: 1;
  gap: var(--space-1);
}

.ghost-danger {
  color: var(--color-danger);
}
</style>
