import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  ApiError,
  deselectPublicPhoto,
  finalizeSelection,
  getPublicAlbum,
  getPublicAlbumPhotos,
  selectPublicPhoto,
  unlockAlbum,
  type PublicAlbumSummary,
  type PublicPhoto,
  type PublicSelectionResult,
} from '@/services/api'

// Galería pública, extraída de PublicGalleryView — tarea 3.3.
// Metadatos del álbum, carga paginada de fotos al hacer scroll, desbloqueo,
// marcado/desmarcado dentro de la cuota, finalización y visor ampliado.
// `error` queda reservado al estado de pantalla (carga/desbloqueo, inline);
// el feedback transitorio de acciones va a toast (design D2/D4).

export const PUBLIC_PAGE_SIZE = 60

export function usePublicAlbum(token: string) {
  const toast = useToast()
  const album = ref<PublicAlbumSummary | null>(null)
  const loading = ref(true)
  const notFound = ref(false)
  const error = ref('')
  const password = ref('')
  const unlocking = ref(false)

  const photos = ref<PublicPhoto[]>([])
  const page = ref(0)
  const hasNext = ref(false)
  const photosLoading = ref(false)
  const photosError = ref('')

  const busyPhotoId = ref<number | null>(null)
  const finalizing = ref(false)
  const lightboxPhoto = ref<PublicPhoto | null>(null)

  const canSelect = computed(() => album.value?.status === 'SELECTING')
  const isFinalized = computed(() => album.value?.status === 'SELECTION_FINALIZED')
  const isDelivering = computed(() => album.value?.status === 'DELIVERING')
  const isLocked = computed(
    () => album.value !== null && album.value.requiresPassword && !album.value.unlocked,
  )
  const selectedCount = computed(() => album.value?.selectedCount ?? 0)
  const canFinalize = computed(
    () => canSelect.value && selectedCount.value > 0 && !finalizing.value,
  )

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    notFound.value = false
    try {
      album.value = await getPublicAlbum(token)
      if (!isLocked.value) {
        await loadPhotos(true)
      }
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

  async function loadPhotos(reset: boolean): Promise<void> {
    if (photosLoading.value) {
      return
    }
    if (!reset && !hasNext.value) {
      return
    }
    photosLoading.value = true
    photosError.value = ''
    try {
      const nextPage = reset ? 0 : page.value + 1
      const result = await getPublicAlbumPhotos(token, nextPage, PUBLIC_PAGE_SIZE)
      photos.value = reset ? result.content : [...photos.value, ...result.content]
      page.value = result.page
      hasNext.value = result.hasNext
    } catch (e) {
      photosError.value = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      photosLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!album.value || isLocked.value) {
      return
    }
    await loadPhotos(false)
  }

  async function unlock(): Promise<void> {
    error.value = ''
    unlocking.value = true
    try {
      album.value = await unlockAlbum(token, password.value)
      await loadPhotos(true)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      unlocking.value = false
    }
  }

  function applySelection(result: PublicSelectionResult): void {
    if (album.value) {
      album.value = {
        ...album.value,
        status: result.status,
        selectedCount: result.selectedCount,
      }
    }
    const index = photos.value.findIndex((photo) => photo.id === result.photo.id)
    if (index !== -1) {
      photos.value[index] = result.photo
    }
    if (lightboxPhoto.value?.id === result.photo.id) {
      lightboxPhoto.value = result.photo
    }
  }

  async function toggle(photo: PublicPhoto): Promise<void> {
    if (!album.value || !canSelect.value) {
      openLightbox(photo)
      return
    }
    busyPhotoId.value = photo.id
    try {
      const result = photo.selected
        ? await deselectPublicPhoto(token, photo.id)
        : await selectPublicPhoto(token, photo.id)
      applySelection(result)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      busyPhotoId.value = null
    }
  }

  async function finalize(): Promise<void> {
    if (!canFinalize.value) {
      return
    }
    finalizing.value = true
    try {
      album.value = await finalizeSelection(token)
      toast.success('Tu selección quedó registrada. El fotógrafo la preparará.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error inesperado')
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
    photos,
    hasNext,
    photosLoading,
    photosError,
    busyPhotoId,
    finalizing,
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
  }
}
