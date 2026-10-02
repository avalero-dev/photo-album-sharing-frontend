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

  async function upload(albumId: number, files: File[]): Promise<void> {
    error.value[albumId] = ''
    try {
      const result = await uploadAdminPhotos(albumId, files)
      photosByAlbum.value[albumId] = result.photos
    } catch (e) {
      error.value[albumId] = e instanceof Error ? e.message : 'Error inesperado'
      throw e
    }
  }

  async function remove(albumId: number, photoId: number): Promise<void> {
    error.value[albumId] = ''
    try {
      await deleteAdminPhoto(albumId, photoId)
      const list = photosByAlbum.value[albumId] ?? []
      photosByAlbum.value[albumId] = list.filter((photo) => photo.id !== photoId)
    } catch (e) {
      error.value[albumId] = e instanceof Error ? e.message : 'Error inesperado'
      throw e
    }
  }

  return { photosByAlbum, loading, error, fetch, upload, remove }
})
