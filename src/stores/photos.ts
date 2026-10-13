import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  deleteAdminPhoto,
  listAdminPhotos,
  uploadAdminPhotos,
  type AdminPhoto,
} from '@/services/api'

export const usePhotosStore = defineStore('photos', () => {
  const photosByAlbum = ref<Record<number, AdminPhoto[]>>({})
  const loading = ref<Record<number, boolean>>({})
  const error = ref<Record<number, string>>({})

  async function fetch(albumId: number): Promise<void> {
    loading.value[albumId] = true
    error.value[albumId] = ''
    try {
      photosByAlbum.value[albumId] = await listAdminPhotos(albumId)
    } catch (e) {
      error.value[albumId] = e instanceof Error ? e.message : 'Error inesperado'
    } finally {
      loading.value[albumId] = false
    }
  }

  // `error[albumId]` queda reservado a `fetch()` (design D1): los fallos de
  // subida/borrado se propagan al composable para presentarse como toast y no
  // deben ocultar las fotos ya visibles de la hoja de contactos.
  async function upload(albumId: number, files: File[]): Promise<void> {
    const result = await uploadAdminPhotos(albumId, files)
    photosByAlbum.value[albumId] = [...(photosByAlbum.value[albumId] ?? []), ...result.photos]
  }

  async function remove(albumId: number, photoId: number): Promise<void> {
    await deleteAdminPhoto(albumId, photoId)
    const list = photosByAlbum.value[albumId] ?? []
    photosByAlbum.value[albumId] = list.filter((photo) => photo.id !== photoId)
  }

  return { photosByAlbum, loading, error, fetch, upload, remove }
})
