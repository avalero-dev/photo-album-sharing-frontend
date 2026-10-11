import { computed, ref } from 'vue'
import { openAlbumDelivery, uploadAdminOriginals, type AdminPhoto } from '@/services/api'
import { useAlbum } from './useAlbum'
import { usePhotosStore } from '@/stores/photos'

// Pantalla de fotos del álbum, extraída de AdminAlbumPhotosView — tarea 3.2.
// Reutiliza el store `photos` (estado compartido por álbum) y añade la
// orquestación de subidas y de apertura de la entrega.

export function useAlbumPhotos(albumId: number) {
  const photosStore = usePhotosStore()
  const {
    album,
    loading: loadingAlbum,
    error: albumError,
    load: loadAlbum,
  } = useAlbum(() => albumId)

  const photos = computed<AdminPhoto[]>(() => photosStore.photosByAlbum[albumId] ?? [])
  const isLoadingPhotos = computed(() => photosStore.loading[albumId] === true)
  const photosError = computed(() => photosStore.error[albumId] ?? '')

  const uploading = ref(false)
  const uploadError = ref('')
  const uploadingOriginals = ref(false)
  const originalError = ref('')
  const openingDelivery = ref(false)
  const deliveryError = ref('')
  const notice = ref('')

  const selectedPhotos = computed(() => photos.value.filter((photo) => photo.selectedAt !== null))
  const canEdit = computed(() => album.value?.status === 'DRAFT')
  const canShowSelection = computed(() => album.value !== null && album.value.status !== 'DRAFT')
  const canUploadOriginals = computed(
    () => album.value?.status === 'SELECTION_FINALIZED' || album.value?.status === 'DELIVERING',
  )
  const canOpenDelivery = computed(() => album.value?.status === 'SELECTION_FINALIZED')

  async function refresh(): Promise<void> {
    await photosStore.fetch(albumId)
  }

  async function upload(files: File[]): Promise<void> {
    uploading.value = true
    uploadError.value = ''
    try {
      await photosStore.upload(albumId, files)
    } catch (e) {
      uploadError.value = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      uploading.value = false
    }
  }

  async function uploadOriginals(files: File[]): Promise<void> {
    uploadingOriginals.value = true
    originalError.value = ''
    notice.value = ''
    try {
      const result = await uploadAdminOriginals(albumId, files)
      await refresh()
      const parts = [`${result.uploaded} original(es) asociado(s)`]
      if (result.unmatched > 0) {
        parts.push(`${result.unmatched} sin coincidencia: ${result.unmatchedFilenames.join(', ')}`)
      }
      notice.value = parts.join(' · ')
    } catch (e) {
      originalError.value = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      uploadingOriginals.value = false
    }
  }

  async function openDelivery(): Promise<void> {
    openingDelivery.value = true
    deliveryError.value = ''
    notice.value = ''
    try {
      album.value = await openAlbumDelivery(albumId)
      notice.value = 'Entrega abierta: el cliente ya puede descargar.'
    } catch (e) {
      deliveryError.value = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      openingDelivery.value = false
    }
  }

  async function deletePhoto(photoId: number): Promise<void> {
    try {
      await photosStore.remove(albumId, photoId)
    } catch (e) {
      uploadError.value = e instanceof Error ? e.message : 'Error inesperado'
    }
  }

  async function init(): Promise<void> {
    await loadAlbum()
    await refresh()
  }

  return {
    album,
    loadingAlbum,
    albumError,
    photos,
    isLoadingPhotos,
    photosError,
    uploading,
    uploadError,
    uploadingOriginals,
    originalError,
    openingDelivery,
    deliveryError,
    notice,
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
  }
}
