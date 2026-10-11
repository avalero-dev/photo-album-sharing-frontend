import { computed, ref } from 'vue'
import {
  ApiError,
  deselectPublicPhoto,
  finalizeSelection,
  getPublicAlbum,
  selectPublicPhoto,
  unlockAlbum,
  type PublicAlbum,
  type PublicPhoto,
} from '@/services/api'

// Galería pública, extraída de PublicGalleryView — tarea 3.3.
// Desbloqueo, marcado/desmarcado dentro de la cuota, finalización y
// descargas; el visor ampliado se maneja con el estado del lightbox.

export function usePublicAlbum(token: string) {
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
  const isFinalized = computed(() => album.value?.status === 'SELECTION_FINALIZED')
  const isDelivering = computed(() => album.value?.status === 'DELIVERING')
  const isLocked = computed(
    () => album.value !== null && album.value.requiresPassword && !album.value.unlocked,
  )
  const selectedCount = computed(
    () => album.value?.photos.filter((photo) => photo.selected).length ?? 0,
  )
  const canFinalize = computed(
    () => canSelect.value && selectedCount.value > 0 && !finalizing.value,
  )

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    notFound.value = false
    notice.value = ''
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
    if (!canFinalize.value) {
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

  return {
    album,
    loading,
    notFound,
    error,
    password,
    unlocking,
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
    unlock,
    toggle,
    finalize,
    openLightbox,
    closeLightbox,
  }
}
